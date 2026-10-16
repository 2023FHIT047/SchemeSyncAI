#!/usr/bin/env python
"""
Backfill scheme detail fields for already-scraped schemes.

Re-fetches each scraped scheme's detail (and its official documents list)
from myScheme and re-imports it so schemes get their application process
(markdown) and accurate required documents. Resumable: processed slugs are
recorded in scripts/sample_data/backfill_state.json and skipped on re-runs.

Usage:
    cd backend
    python scripts/backfill_scheme_details.py
"""

import os
import sys
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django  # noqa: E402
django.setup()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from scrape_myscheme import fetch_detail, import_from_detail  # noqa: E402
from apps.schemes.models import GovernmentScheme  # noqa: E402
from django.db import transaction, connection  # noqa: E402
from django.db.models import Count  # noqa: E402

STATE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'sample_data', 'backfill_state.json'
)
WORKERS = 3


def load_state():
    if os.path.exists(STATE_PATH):
        with open(STATE_PATH, encoding='utf-8') as f:
            return set(json.load(f))
    return set()


def save_state(done):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(sorted(done), f)


def process_slug(slug):
    """Fetch + import one scheme. Retries once on any error."""
    for attempt in (1, 2):
        try:
            detail = fetch_detail(slug)
            if not detail:
                return slug, False
            with transaction.atomic():
                import_from_detail(detail, slug)
            return slug, True
        except Exception as exc:
            if attempt == 2:
                print(f'  ERROR {slug}: {exc}', flush=True)
                return slug, False
            time.sleep(1.5)
        finally:
            connection.close()
    return slug, False


def main():
    done = load_state()
    scraped = GovernmentScheme.objects.filter(is_demo_data=False)

    # Schemes that already show required documents first, so pages users
    # are most likely to check get fixed early.
    priority = list(
        scraped.annotate(n_docs=Count('required_documents'))
        .filter(n_docs__gt=0)
        .exclude(scheme_id__in=done)
        .values_list('scheme_id', flat=True)
    )
    rest = list(
        scraped.exclude(scheme_id__in=set(priority) | done)
        .values_list('scheme_id', flat=True)
    )
    queue = priority + rest
    total = len(queue)
    print(f'Backfill queue: {total} schemes ({len(priority)} with existing docs first), workers={WORKERS}', flush=True)
    if not total:
        print('Nothing to do.', flush=True)
        return

    ok = fail = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(process_slug, slug): slug for slug in queue}
        for i, future in enumerate(as_completed(futures), 1):
            slug, success = future.result()
            done.add(slug)
            if success:
                ok += 1
            else:
                fail += 1

            if i % 30 == 0 or i == total:
                elapsed = time.time() - t0
                rate = i / elapsed if elapsed else 0
                eta_min = (total - i) / rate / 60 if rate else 0
                print(
                    f'[{i}/{total}] ok={ok} fail={fail} | {rate:.2f} schemes/s | ETA {eta_min:.0f} min',
                    flush=True,
                )
                save_state(done)

    save_state(done)
    print(f'Backfill complete: ok={ok} fail={fail} in {(time.time() - t0) / 60:.0f} min', flush=True)


if __name__ == '__main__':
    main()
