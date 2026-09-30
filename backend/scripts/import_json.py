#!/usr/bin/env python
"""
Restore schemes from a JSON dataset file into the Django database.
This is the reverse of export_json.py — no scraping needed.

Usage:
    cd backend
    python scripts/import_json.py                          # default file
    python scripts/import_json.py --file path/to/data.json  # custom file
"""

import os
import sys
import json
import argparse
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.schemes.models import GovernmentScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument


def restore(file_path):
    print(f"Loading dataset from: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    stats = {'schemes': 0, 'rules': 0, 'docs': 0, 'skipped': 0}

    # ── 1. Schemes (no FK dependencies) ──
    print("\nRestoring GovernmentScheme records...")
    scheme_records = dataset.get("schemes", [])
    for rec in scheme_records:
        fields = rec.get("fields", {})
        scheme_id = fields.get("scheme_id")
        if not scheme_id:
            stats["skipped"] += 1
            continue
        obj, created = GovernmentScheme.objects.update_or_create(
            scheme_id=scheme_id,
            defaults=fields,
        )
        stats["schemes"] += 1
        if stats["schemes"] % 500 == 0:
            print(f"  ... {stats['schemes']} schemes restored")

    print(f"  {stats['schemes']} schemes imported")

    # ── 2. Eligibility Rules (FK: EligibilityRule.scheme_id → scheme_id) ──
    print("\nRestoring EligibilityRule records...")
    # Build slug → pk lookup
    slug_to_pk = {s.scheme_id: s.pk for s in GovernmentScheme.objects.all()}

    rule_records = dataset.get("eligibility_rules", [])
    for rec in rule_records:
        fields = rec.get("fields", {})
        scheme_slug = fields.get("scheme")
        # In fixture format, "scheme" may be a pk or scheme_id string
        if isinstance(scheme_slug, str):
            scheme_pk = slug_to_pk.get(scheme_slug)
        else:
            scheme_pk = scheme_slug  # already a pk number

        if scheme_pk and GovernmentScheme.objects.filter(pk=scheme_pk).exists():
            EligibilityRule.objects.create(
                scheme_id=scheme_pk,
                **{k: v for k, v in fields.items() if k != "scheme"}
            )
            stats["rules"] += 1
        else:
            stats["skipped"] += 1

    print(f"  {stats['rules']} eligibility rules imported")

    # ── 3. Required Documents ──
    print("\nRestoring RequiredDocument records...")
    doc_records = dataset.get("required_documents", [])
    for rec in doc_records:
        fields = rec.get("fields", {})
        scheme_slug = fields.get("scheme")
        if isinstance(scheme_slug, str):
            scheme_pk = slug_to_pk.get(scheme_slug)
        else:
            scheme_pk = scheme_slug

        if scheme_pk and GovernmentScheme.objects.filter(pk=scheme_pk).exists():
            RequiredDocument.objects.create(
                scheme_id=scheme_pk,
                **{k: v for k, v in fields.items() if k != "scheme"}
            )
            stats["docs"] += 1
        else:
            stats["skipped"] += 1

    print(f"  {stats['docs']} documents imported")
    print(f"\nSkipped {stats['skipped']} records (missing scheme reference)")
    print("\n" + "=" * 60)
    print("Restore complete!")
    print(f"  Schemes:           {stats['schemes']}")
    print(f"  Eligibility Rules: {stats['rules']}")
    print(f"  Documents:         {stats['docs']}")
    print("=" * 60)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Restore government schemes from JSON dataset file"
    )
    parser.add_argument(
        '--file',
        default=os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'scripts', 'sample_data', 'myscheme_dataset.json'
        ),
        help="Path to the JSON dataset file"
    )
    args = parser.parse_args()
    restore(args.file)
