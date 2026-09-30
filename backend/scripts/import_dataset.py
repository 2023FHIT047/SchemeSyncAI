import os
import sys
import django
import pandas as pd
import argparse

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.schemes.models import GovernmentScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

def parse_and_import(file_path):
    """
    Imports government schemes from an Excel (.xlsx) or CSV (.csv) file into Django models.
    
    Expected Columns:
    - scheme_id
    - scheme_name
    - category (FARMER, EDUCATION, WOMEN_CHILD, HEALTHCARE, EMPLOYMENT, etc.)
    - subcategory
    - ministry
    - scheme_type (CENTRAL, STATE, JOINT)
    - applicable_state
    - short_description
    - detailed_description
    - objective
    - benefits
    - benefit_type
    - benefit_amount
    - application_mode
    - application_link
    - official_website
    - rules (Pipe-separated e.g. "age>=18|gender=FEMALE|annual_family_income<=250000")
    - documents (Pipe-separated e.g. "Aadhaar Card|Income Certificate|7/12 Extract")
    """
    print(f"Reading dataset file: {file_path}")
    if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
        df = pd.read_excel(file_path)
    elif file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        raise ValueError("Unsupported file format. Please provide a .csv or .xlsx file.")

    success_count = 0
    error_count = 0

    for idx, row in df.iterrows():
        try:
            scheme_id = str(row['scheme_id']).strip()
            scheme_name = str(row['scheme_name']).strip()
            
            scheme, created = GovernmentScheme.objects.update_or_create(
                scheme_id=scheme_id,
                defaults={
                    'scheme_name': scheme_name,
                    'category': str(row.get('category', 'OTHER')).strip().upper(),
                    'subcategory': str(row.get('subcategory', '')).strip(),
                    'ministry': str(row.get('ministry', 'Government Nodal Agency')).strip(),
                    'scheme_type': str(row.get('scheme_type', 'CENTRAL')).strip().upper(),
                    'applicable_state': str(row.get('applicable_state', 'All India')).strip(),
                    'short_description': str(row.get('short_description', '')).strip(),
                    'detailed_description': str(row.get('detailed_description', '')).strip(),
                    'objective': str(row.get('objective', '')).strip(),
                    'benefits': str(row.get('benefits', '')).strip(),
                    'benefit_type': str(row.get('benefit_type', 'FINANCIAL')).strip().upper(),
                    'benefit_amount': str(row.get('benefit_amount', '')).strip(),
                    'application_mode': str(row.get('application_mode', 'ONLINE')).strip().upper(),
                    'application_link': str(row.get('application_link', '')).strip(),
                    'official_website': str(row.get('official_website', '')).strip(),
                    'is_demo_data': False
                }
            )

            # Process Rules if present
            if 'rules' in row and pd.notna(row['rules']):
                rules_str = str(row['rules']).strip()
                rules_list = rules_str.split('|')
                scheme.eligibility_rules.all().delete()
                
                for r_item in rules_list:
                    if not r_item.strip():
                        continue
                    # Format: attribute operator value (e.g. age >= 18)
                    for op in ['>=', '<=', '!=', 'IN', 'NOT IN', '>', '<', '=']:
                        if op in r_item:
                            parts = r_item.split(op)
                            attr = parts[0].strip()
                            val = parts[1].strip()
                            
                            val_type = 'STRING'
                            if val.isdigit():
                                val_type = 'NUMBER'
                            elif val.lower() in ('true', 'false'):
                                val_type = 'BOOLEAN'
                            elif ',' in val:
                                val_type = 'LIST'

                            EligibilityRule.objects.create(
                                scheme=scheme,
                                attribute=attr,
                                operator=op,
                                value=val,
                                value_type=val_type,
                                description=f"Requirement: {attr} {op} {val}",
                                is_mandatory=True
                            )
                            break

            # Process Documents if present
            if 'documents' in row and pd.notna(row['documents']):
                docs_str = str(row['documents']).strip()
                docs_list = docs_str.split('|')
                scheme.required_documents.all().delete()

                for d_item in docs_list:
                    if d_item.strip():
                        RequiredDocument.objects.create(
                            scheme=scheme,
                            document_name=d_item.strip(),
                            is_mandatory=True,
                            description=f"Official required document: {d_item.strip()}"
                        )

            success_count += 1
            print(f"[{'CREATED' if created else 'UPDATED'}] {scheme_id}: {scheme_name}")

        except Exception as e:
            error_count += 1
            print(f"[ERROR] Row {idx} ({row.get('scheme_id', 'Unknown')}): {str(e)}")

    print(f"\nImport Finished: {success_count} schemes processed successfully, {error_count} errors.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Import Government Scheme Dataset into PostgreSQL database.")
    parser.add_argument('--file', required=True, help="Path to Excel (.xlsx) or CSV (.csv) file")
    args = parser.parse_argument_kwargs if hasattr(parser, 'parse_argument_kwargs') else parser.parse_args()
    parse_and_import(args.file)
