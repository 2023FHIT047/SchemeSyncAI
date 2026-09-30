#!/usr/bin/env python
"""
Export all scraped schemes to a JSON fixture file for later restoration.
This creates a portable dataset — no need to re-scrape the API.

Usage:
    cd backend
    python scripts/export_json.py
"""

import os
import sys
import json
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core import serializers
from apps.schemes.models import GovernmentScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'scripts', 'sample_data'
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

output_path = os.path.join(OUTPUT_DIR, 'myscheme_dataset.json')

print("Exporting schemes (excluding demo data)...")
schemes_json = serializers.serialize(
    'json',
    GovernmentScheme.objects.filter(is_demo_data=False),
    indent=2
)

print("Exporting eligibility rules...")
rules_json = serializers.serialize(
    'json',
    EligibilityRule.objects.filter(scheme__is_demo_data=False)
)

print("Exporting required documents...")
docs_json = serializers.serialize(
    'json',
    RequiredDocument.objects.filter(scheme__is_demo_data=False)
)

dataset = {
    "schemes": json.loads(schemes_json),
    "eligibility_rules": json.loads(rules_json),
    "required_documents": json.loads(docs_json),
}

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(dataset, f, indent=2, ensure_ascii=False)

total_schemes = len(dataset["schemes"])
total_rules = len(dataset["eligibility_rules"])
total_docs = len(dataset["required_documents"])
file_size_mb = os.path.getsize(output_path) / (1024 * 1024)

print(f"\nExport complete!")
print(f"   Schemes:           {total_schemes}")
print(f"   Eligibility Rules: {total_rules}")
print(f"   Documents:         {total_docs}")
print(f"   File:              {output_path}")
print(f"   Size:              {file_size_mb:.1f} MB")
