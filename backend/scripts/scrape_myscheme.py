#!/usr/bin/env python
"""
Scraper bot for myScheme.gov.in
================================
Fetches government schemes from the myScheme API and imports them into
the Django models (GovernmentScheme, EligibilityRule, RequiredDocument).

Usage:
    cd backend
    python scripts/scrape_myscheme.py                          # fast mode (list only)
    python scripts/scrape_myscheme.py --enrich-all             # full details per scheme
    python scripts/scrape_myscheme.py --max-pages 5 --enrich-all # limited run
    python scripts/scrape_myscheme.py --keyword "scholarship"  # filtered
    python scripts/scrape_myscheme.py --state "Telangana"      # state filter
"""

import os
import sys
import json
import time
import re
import html
import argparse
import logging
import requests
from urllib.parse import quote


def deep_unescape(text):
    """Decode HTML entities, handling double-encoding from the myScheme API."""
    if not text:
        return text
    prev = None
    result = str(text)
    for _ in range(3):
        prev = result
        result = html.unescape(result)
        if result == prev:
            break
    return result.strip()

# -- Django setup -----------------------------------------------------------
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django  # noqa: E402
django.setup()

from apps.schemes.models import GovernmentScheme        # noqa: E402
from apps.eligibility.models import EligibilityRule     # noqa: E402
from apps.documents.models import RequiredDocument      # noqa: E402

# -- Logging ----------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger("scrape_myscheme")

# -- myScheme API configuration -----------------------------------------------
API_BASE = "https://api.myscheme.gov.in"
SEARCH_URL = f"{API_BASE}/search/v6/schemes"
DETAIL_URL = f"{API_BASE}/schemes/v6/public/schemes"
PORTAL = "https://www.myscheme.gov.in"

# API key embedded in the public myScheme frontend JS.
# To get an official key, register at https://apisetu.gov.in/
API_KEY = os.environ.get(
    "MYSCHEME_API_KEY",
    "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc",
)

HEADERS = {
    "x-api-key": API_KEY,
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; GovSchemePlatform/1.0)",
    "Origin": PORTAL,
    "Referer": f"{PORTAL}/",
}

PAGE_SIZE = 50  # API maximum per page


# -- Helpers ----------------------------------------------------------------

def _label(value):
    """Extract the display label from a myScheme {label: ...} object or string."""
    if isinstance(value, dict):
        return value.get("label", "")
    return str(value) if value else ""


CATEGORY_MAP = {
    "agriculture": "FARMER",
    "rural": "FARMER",
    "farming": "FARMER",
    "education": "EDUCATION",
    "learning": "EDUCATION",
    "student": "EDUCATION",
    "health": "HEALTHCARE",
    "wellness": "HEALTHCARE",
    "medical": "HEALTHCARE",
    "social welfare": "WOMEN_CHILD",
    "empowerment": "WOMEN_CHILD",
    "women": "WOMEN_CHILD",
    "child": "WOMEN_CHILD",
    "employment": "EMPLOYMENT",
    "livelihood": "EMPLOYMENT",
    "business": "SKILL_DEV",
    "entrepreneurship": "SKILL_DEV",
    "skill": "SKILL_DEV",
    "science": "SKILL_DEV",
    "technology": "SKILL_DEV",
    "housing": "HOUSING",
    "shelter": "HOUSING",
    "senior": "SENIOR_CITIZEN",
    "pension": "SENIOR_CITIZEN",
    "finance": "OTHER",
    "insurance": "OTHER",
    "banking": "OTHER",
    "sports": "OTHER",
    "culture": "OTHER",
    "transport": "OTHER",
    "utility": "OTHER",
    "safety": "OTHER",
    "law": "OTHER",
    "justice": "OTHER",
}


def map_category(categories):
    """Map myScheme category labels to your Django category choice."""
    if not categories:
        return "OTHER"
    if isinstance(categories, str):
        categories = [categories]
    for cat in categories:
        cat_label = _label(cat).lower()
        for keyword, db_choice in CATEGORY_MAP.items():
            if keyword in cat_label:
                return db_choice
    return "OTHER"


def extract_benefit_amount(benefits_text):
    """Extract a currency amount string from benefits text."""
    if not benefits_text:
        return ""
    match = re.search(
        r'[₹Rs]{1,4}\.?\s*[\d,]+(?:\.\d+)?'
        r'(?:\s*(?:per\s+\w+|/year|/annum|/month|/ha|annually|monthly|crore|lakh|million))?',
        str(benefits_text), re.IGNORECASE,
    )
    if match:
        return match.group(0).strip()
    match = re.search(r'\d{1,3}(?:,\d{3})+(?:\s*(?:\bp[/-]\s*)?\w+)?', str(benefits_text))
    if match:
        return "₹ " + match.group(0).strip()
    return ""


def parse_documents(documents_text):
    """Parse the documents string into a list of clean document names."""
    if not documents_text:
        return []
    docs = []
    for chunk in re.split(r'\n\s*[\d.\-]|\.\s+(?=[A-Z])', str(documents_text)):
        chunk = re.sub(r'[\[\(].*?[\]\)]', '', chunk).strip().strip('.').strip()
        chunk = re.sub(r'^[\d.\s]+', '', chunk).strip()
        if chunk and 3 < len(chunk) < 200:
            docs.append(chunk)
    return docs


def parse_eligibility_rules(eligibility_text):
    """Parse natural-language eligibility text into structured rules."""
    rules = []
    if not eligibility_text:
        return rules
    text = str(eligibility_text)

    # Age: "aged between 18 and 60" or "age should be 21"
    for match in re.finditer(
        r'age(?:d)?\s*(?:should\s+be|between|of)?\s*(\d+)\s*'
        r'(?:and|to|–|-)?\s*(\d+)?',
        text, re.IGNORECASE,
    ):
        mn = match.group(1)
        mx = match.group(2)
        rules.append({
            'attribute': 'age', 'operator': '>=',
            'value': mn, 'value_type': 'NUMBER',
            'description': f"Age must be at least {mn} years",
        })
        if mx:
            rules.append({
                'attribute': 'age', 'operator': '<=',
                'value': mx, 'value_type': 'NUMBER',
                'description': f"Age must not exceed {mx} years",
            })

    # Income: "annual family income should not exceed ₹2,50,000"
    for match in re.finditer(
        r'(?:annual|family|gross)\s*(?:total\s*)?income.*?'
        r'[₹Rs]{1,4}\.?\s*([\d,]+(?:\.\d+)?)',
        text, re.IGNORECASE,
    ):
        raw = match.group(1).replace(',', '')
        rules.append({
            'attribute': 'annual_family_income', 'operator': '<=',
            'value': raw, 'value_type': 'NUMBER',
            'description': f"Annual family income must not exceed ₹{match.group(1)}",
        })

    # Residency / state
    for match in re.finditer(
        r'(?:resident|domicile|residing|native)\s+of\s+([A-Z][A-Za-z\s]+?)(?:\.|,|;|$)',
        text,
    ):
        state = match.group(1).strip()
        rules.append({
            'attribute': 'resident_state', 'operator': '=',
            'value': state, 'value_type': 'STRING',
            'description': f"Must be a resident of {state}",
        })

    # Caste / social category
    for match in re.finditer(r'\b(SC|ST|OBC|General|Minority)\b', text, re.IGNORECASE):
        cat = match.group(1).upper()
        rules.append({
            'attribute': 'caste_category', 'operator': 'IN',
            'value': cat, 'value_type': 'STRING',
            'description': f"Beneficiary must belong to {cat} category",
        })

    # Gender
    if re.search(r'female|woman|women|girl', text, re.IGNORECASE):
        rules.append({
            'attribute': 'gender', 'operator': '=',
            'value': 'FEMALE', 'value_type': 'STRING',
            'description': "Scheme is for female beneficiaries",
        })

    # Student
    if re.search(r'student|studying|enrollee|enrolled', text, re.IGNORECASE):
        rules.append({
            'attribute': 'is_student', 'operator': '=',
            'value': 'True', 'value_type': 'BOOLEAN',
            'description': "Applicant must be a student",
        })

    return rules


# -- API calls --------------------------------------------------------------

def search_page(from_index, keyword="", filters=None):
    """Fetch one page of search results from the myScheme API."""
    q = quote(json.dumps(filters or [], separators=(",", ":")))
    url = (
        f"{SEARCH_URL}?lang=en&q={q}"
        f"&keyword={quote(keyword)}&sort=&from={from_index}&size={PAGE_SIZE}"
    )
    resp = requests.get(url, headers=HEADERS, timeout=45)
    if resp.status_code != 200:
        log.warning("Search HTTP %s: %s", resp.status_code, resp.text[:300])
        return None
    payload = resp.json()
    if payload.get("status") != "Success":
        log.warning("API error: %s", payload.get("errorDescription", payload))
        return None
    return payload["data"]


def fetch_detail(slug):
    """Fetch full details for one scheme by slug."""
    url = f"{DETAIL_URL}?slug={slug}&lang=en"
    resp = requests.get(url, headers=HEADERS, timeout=45)
    if resp.status_code != 200:
        log.warning("Detail HTTP %s for '%s'", resp.status_code, slug)
        return None
    payload = resp.json()
    if payload.get("status") != "Success":
        log.warning("Detail API error for '%s': %s", slug, payload.get("errorDescription"))
        return None
    return payload.get("data")


# -- Import logic -----------------------------------------------------------

def import_from_detail(scheme_data, slug):
    """Import a full detail record into Django models.
    Returns True if the scheme was newly created, False if updated.
    """
    en = scheme_data.get("en") or {}
    if not isinstance(en, dict):
        en = {}

    basic = en.get("basicDetails") or {}
    content = en.get("schemeContent") or {}
    elig = en.get("eligibilityCriteria") or {}

    # applicationProcess comes as a list of dicts from the API (e.g.
    # [{mode, url, process, process_md}, ...])
    _app_proc_raw = en.get("applicationProcess") or []
    app_proc = (
        _app_proc_raw[0]
        if isinstance(_app_proc_raw, list)
        and _app_proc_raw
        and isinstance(_app_proc_raw[0], dict)
        else _app_proc_raw
        if isinstance(_app_proc_raw, dict)
        else {}
    )

    categories = basic.get("schemeCategory") or []
    category = map_category(categories)

    level_obj = basic.get("level") or {}
    level_label = _label(level_obj).lower() if level_obj else "central"

    ministry_obj = basic.get("nodalMinistryName") or {}
    ministry = _label(ministry_obj) or ""

    states = basic.get("beneficiaryState") or []
    if isinstance(states, list):
        states = [_label(s) for s in states if _label(s)]

    tags = basic.get("tags") or basic.get("schemeTag") or []
    if isinstance(tags, list):
        tags = [_label(t) if isinstance(t, dict) else str(t) for t in tags]

    # Determine applicable state
    if level_label == "state" and states:
        applicable_state = states[0]
    else:
        applicable_state = "All India"

    # Benefits
    benefits = content.get("benefits_md") or content.get("benefits", "")
    if isinstance(benefits, list):
        benefits = " ".join(str(b) for b in benefits)
    benefits = str(benefits)

    benefit_amount = extract_benefit_amount(benefits)

    # Descriptions
    detailed_desc = content.get("detailedDescription_md") or content.get("briefDescription", "")
    if isinstance(detailed_desc, list):
        detailed_desc = " ".join(str(d) for d in detailed_desc)
    brief_desc = content.get("briefDescription", "")
    if isinstance(brief_desc, list):
        brief_desc = str(brief_desc[0]) if brief_desc else ""

    short_desc = str(brief_desc or detailed_desc or basic.get("schemeName", slug))[:500]

    eligibility_text = elig.get("eligibilityDescription_md") or elig.get("eligibilityDescription", "")
    if isinstance(eligibility_text, list):
        eligibility_text = " ".join(str(e) for e in eligibility_text)
    eligibility_text = str(eligibility_text)

    # Documents — applicationProcess may have documents_md, process_md, or documents
    documents_text = (
        app_proc.get("documents_md")
        or app_proc.get("process_md")
        or app_proc.get("documents", "")
    )
    if isinstance(documents_text, list):
        documents_text = " ".join(str(d) for d in documents_text)
    documents_text = str(documents_text)

    # Application link from references
    application_link = f"{PORTAL}/schemes/{slug}"
    references = content.get("references") or []
    if isinstance(references, list):
        for ref in references:
            if isinstance(ref, dict) and ref.get("url"):
                application_link = ref["url"]
                break

    # Scheme status
    status_obj = basic.get("schemeStatus") or {}
    status_label = _label(status_obj).lower() if status_obj else "active"
    status_map = {
        "active": "ACTIVE", "inactive": "INACTIVE",
        "upcoming": "UPCOMING", "closed": "CLOSED",
    }

    # Launch year
    launch_year = basic.get("launchYear") or basic.get("schemeLaunchYear")

    # Benefit type heuristic
    benefits_lower = benefits.lower()
    if "insurance" in benefits_lower:
        benefit_type = "IN_KIND"
    elif "scholarship" in benefits_lower or "stipend" in benefits_lower:
        benefit_type = "SCHOLARSHIP"
    elif "loan" in benefits_lower:
        benefit_type = "LOAN"
    elif "pension" in benefits_lower:
        benefit_type = "PENSION"
    elif "subsidy" in benefits_lower:
        benefit_type = "SUBSIDY"
    elif benefits:
        benefit_type = "FINANCIAL"
    else:
        benefit_type = "OTHER"

    # -- Create / update GovernmentScheme --
    scheme, created = GovernmentScheme.objects.update_or_create(
        scheme_id=slug,
        defaults={
            "scheme_name": deep_unescape(basic.get("schemeName") or basic.get("schemeShortTitle") or slug),
            "category": category,
            "subcategory": deep_unescape(", ".join(str(t) for t in tags)[:100]) if tags else "",
            "ministry": deep_unescape(ministry) or "Government of India",
            "scheme_type": "STATE" if level_label == "state" else "CENTRAL",
            "applicable_state": applicable_state,
            "short_description": deep_unescape(short_desc),
            "detailed_description": deep_unescape(str(detailed_desc)[:5000]),
            "objective": deep_unescape(short_desc)[:2000],
            "benefits": deep_unescape(benefits[:5000]),
            "benefit_type": benefit_type,
            "benefit_amount": deep_unescape(benefit_amount),
            "application_mode": "ONLINE",
            "application_link": application_link,
            "official_website": f"{PORTAL}/schemes/{slug}",
            "scheme_status": status_map.get(status_label, "ACTIVE"),
            "launch_year": launch_year,
            "is_demo_data": False,
        },
    )

    # -- EligibilityRule records --
    scheme.eligibility_rules.all().delete()
    rules = parse_eligibility_rules(eligibility_text)
    if not rules:
        rules = [{
            "attribute": "eligibility_text",
            "operator": "=",
            "value": "REVIEW_REQUIRED",
            "value_type": "STRING",
            "description": deep_unescape(eligibility_text or "See official myScheme page")[:255],
        }]
    for rule in rules:
        EligibilityRule.objects.create(scheme=scheme, is_mandatory=True, **rule)

    # -- RequiredDocument records --
    scheme.required_documents.all().delete()
    docs = parse_documents(documents_text)
    for doc_name in docs:
        RequiredDocument.objects.create(
            scheme=scheme,
            document_name=deep_unescape(doc_name),
            is_mandatory=True,
            description=f"Required for {scheme.scheme_name}",
        )

    return created


def import_from_search(fields):
    """Fast import using search-level data only (no detail API call).
    Returns True if newly created, False if updated, None on error.
    """
    slug = fields.get("slug", "")
    if not slug:
        return None

    level_obj = fields.get("level") or {}
    level_label = _label(level_obj).lower() if level_obj else "central"

    ministry = _label(fields.get("nodalMinistryName") or {})
    states = fields.get("beneficiaryState") or []
    states = [_label(s) for s in states if _label(s)] if isinstance(states, list) else states

    categories = fields.get("schemeCategory") or []

    scheme, created = GovernmentScheme.objects.update_or_create(
        scheme_id=slug,
        defaults={
            "scheme_name": fields.get("schemeName") or slug,
            "category": map_category(categories) if categories else "OTHER",
            "subcategory": "",
            "ministry": ministry or "Government of India",
            "scheme_type": "STATE" if level_label == "state" else "CENTRAL",
            "applicable_state": states[0] if (level_label == "state" and states) else "All India",
            "short_description": (fields.get("briefDescription") or "")[:500],
            "detailed_description": (fields.get("briefDescription") or "")[:5000],
            "objective": "",
            "benefits": "",
            "benefit_type": "OTHER",
            "benefit_amount": "",
            "application_mode": "ONLINE",
            "application_link": f"{PORTAL}/schemes/{slug}",
            "official_website": PORTAL,
            "scheme_status": "ACTIVE",
            "is_demo_data": False,
        },
    )
    return created


# -- Main scraper loop ------------------------------------------------------

def scrape(max_pages=None, enrich_all=False, keyword="", filters=None):
    """Scrape schemes from the myScheme API and import into Django.

    Args:
        max_pages:  Limit to N x 50 search results (None = all pages)
        enrich_all: If True, fetch full detail for every scheme (slow)
        keyword:    Optional keyword filter passed to the search API
        filters:    Optional list of filter dicts {'identifier':..., 'value':...}
    """
    total_created = 0
    total_updated = 0
    total_errors = 0
    from_idx = 0
    page = 0

    log.info("Starting myScheme scraper — API key prefix: %s...", API_KEY[:8])
    log.info("Mode: %s", "ENRICH (full details)" if enrich_all else "FAST (summary only)")

    while True:
        if max_pages is not None and page >= max_pages:
            log.info("Reached --max-pages limit (%d)", max_pages)
            break

        data = search_page(from_idx, keyword=keyword, filters=filters)
        if data is None:
            total_errors += 1
            log.warning("Search returned None at offset %d, stopping", from_idx)
            break

        items = data.get("hits", {}).get("items", [])
        if not items:
            log.info("No more items — search complete")
            break

        total_avail = data.get("summary", {}).get("total", "?")
        log.info(
            "Page %d: %d items (offset %d, total available=%s)",
            page, len(items), from_idx, total_avail,
        )

        for item in items:
            fields = item.get("fields", {})
            slug = fields.get("slug", "")
            if not slug:
                continue

            try:
                if enrich_all:
                    detail = fetch_detail(slug)
                    if detail:
                        created = import_from_detail(detail, slug)
                        if created:
                            total_created += 1
                        else:
                            total_updated += 1
                    else:
                        total_errors += 1
                else:
                    created = import_from_search(fields)
                    if created is None:
                        total_errors += 1
                    elif created:
                        total_created += 1
                    else:
                        total_updated += 1

            except Exception as exc:
                total_errors += 1
                log.error("Error processing '%s': %s", slug, exc)

            time.sleep(0.3)  # per-item rate limit

        from_idx += PAGE_SIZE
        page += 1
        time.sleep(1.5)  # per-page rate limit

    # -- Summary --
    total_in_db = GovernmentScheme.objects.filter(is_demo_data=False).count()
    log.info("=" * 65)
    log.info("Scrape complete!")
    log.info("  Created (new):      %d", total_created)
    log.info("  Updated (existing): %d", total_updated)
    log.info("  Errors:             %d", total_errors)
    log.info("  Total in DB now:    %d", total_in_db)
    log.info("=" * 65)


# -- CLI --------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scrape government schemes from myScheme.gov.in API"
    )
    parser.add_argument(
        "--max-pages", type=int, default=None,
        help="Limit number of search pages (50 schemes per page). Default: all pages",
    )
    parser.add_argument(
        "--enrich-all", action="store_true",
        help="Fetch full details (eligibility, benefits, documents) for each scheme. "
             "Without this flag, only search-level summary is imported.",
    )
    parser.add_argument(
        "--keyword", type=str, default="",
        help="Keyword filter (e.g. 'scholarship', 'farmer', 'insurance')",
    )
    parser.add_argument(
        "--state", type=str, default=None,
        help="Filter by beneficiary state (e.g. 'Telangana', 'West Bengal')",
    )
    args = parser.parse_args()

    # Build filter list from CLI args
    cli_filters = []
    if args.state:
        cli_filters.append({"identifier": "beneficiaryState", "value": args.state})

    scrape(
        max_pages=args.max_pages,
        enrich_all=args.enrich_all,
        keyword=args.keyword,
        filters=cli_filters or None,
    )
