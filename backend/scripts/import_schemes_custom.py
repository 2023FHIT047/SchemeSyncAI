import os
import sys
import django
import pandas as pd
import argparse
import re
from urllib.parse import urlparse

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.schemes.models import GovernmentScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

# Category mapping from your CSV to database choices
CATEGORY_MAPPING = {
    'agriculture': 'FARMER',
    'rural': 'FARMER',
    'farming': 'FARMER',
    'education': 'EDUCATION',
    'learning': 'EDUCATION',
    'student': 'EDUCATION',
    'health': 'HEALTHCARE',
    'wellness': 'HEALTHCARE',
    'medical': 'HEALTHCARE',
    'insurance': 'OTHER',
    'banking': 'OTHER',
    'finance': 'OTHER',
    'social welfare': 'WOMEN_CHILD',
    'empowerment': 'WOMEN_CHILD',
    'women': 'WOMEN_CHILD',
    'child': 'WOMEN_CHILD',
    'employment': 'EMPLOYMENT',
    'livelihood': 'EMPLOYMENT',
    'business': 'SKILL_DEV',
    'entrepreneurship': 'SKILL_DEV',
    'skill': 'SKILL_DEV',
    'science': 'SKILL_DEV',
    'technology': 'SKILL_DEV',
    'housing': 'HOUSING',
    'shelter': 'HOUSING',
    'senior': 'SENIOR_CITIZEN',
    'senior citizen': 'SENIOR_CITIZEN',
    'pension': 'SENIOR_CITIZEN',
    'sports': 'OTHER',
    'culture': 'OTHER',
    'transport': 'OTHER',
    'utility': 'OTHER',
    'safety': 'OTHER',
    'law': 'OTHER',
    'justice': 'OTHER',
}

def map_category(csv_category):
    """
    Map the CSV category string to database category choices.
    Handles comma-separated categories by extracting the primary one.
    """
    if not csv_category:
        return 'OTHER'
    
    # Convert to lowercase and split by comma
    categories = [c.strip().lower() for c in str(csv_category).split(',')]
    
    # Try to find a matching category
    for cat_part in categories:
        for keyword, db_choice in CATEGORY_MAPPING.items():
            if keyword in cat_part:
                return db_choice
    
    return 'OTHER'

def extract_benefit_amount(benefits_text):
    """
    Extract numeric benefit amount from benefits text using regex.
    Looks for currency symbols and numbers.
    """
    if not benefits_text:
        return ''
    
    # Look for ₹ or Rs. followed by numbers
    matches = re.findall(r'[₹Rs\.]+\s*[\d,]+[,\d]*(?:\s*(?:per|\/|per annum|annually|monthly|per hectare))?', str(benefits_text), re.IGNORECASE)
    if matches:
        return matches[0].strip()
    
    # Look for just numbers with thousands
    matches = re.findall(r'\d{1,3}(?:,\d{3})+(?:\s*[-/]\s*)?(?:per|annum|monthly|hectare)?', str(benefits_text))
    if matches:
        return matches[0].strip()
    
    return ''

def extract_state_from_text(details_text, applicable_state_text):
    """
    Extract state name from details or applicable_state field.
    Returns the state or 'All India' as default.
    """
    if applicable_state_text and str(applicable_state_text).strip().lower() not in ['', 'nan', 'all india']:
        return str(applicable_state_text).strip()
    
    # Look for state names in details text
    state_keywords = [
        'telangana', 'puducherry', 'bihar', 'odisha', 'tripura', 'maharashtra',
        'karnataka', 'tamil nadu', 'uttarpradesh', 'west bengal', 'delhi',
        'punjab', 'haryana', 'rajasthan', 'kerala', 'andhra pradesh'
    ]
    
    details_lower = str(details_text).lower() if details_text else ''
    for state in state_keywords:
        if state in details_lower:
            return state.title()
    
    return 'All India'

def parse_eligibility_rules(eligibility_text):
    """
    Parse natural language eligibility text into structured rule patterns.
    Extracts common eligibility criteria as key-value pairs.
    """
    if not eligibility_text:
        return []
    
    rules = []
    text = str(eligibility_text)
    
    # Split by periods and process each sentence
    sentences = re.split(r'[.!?]', text)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        # Extract common rule patterns
        
        # Age patterns: "aged between 18 and 60" or "age >= 18"
        age_match = re.search(r'aged?\s+(?:between\s+)?(\d+)\s+(?:and|to|-|years)\s+(\d+)', sentence, re.IGNORECASE)
        if age_match:
            rules.append({
                'attribute': 'age',
                'operator': '>=',
                'value': age_match.group(1),
                'description': f"Age must be at least {age_match.group(1)} years",
                'value_type': 'NUMBER'
            })
            rules.append({
                'attribute': 'age',
                'operator': '<=',
                'value': age_match.group(2),
                'description': f"Age must not exceed {age_match.group(2)} years",
                'value_type': 'NUMBER'
            })
            continue
        
        # Income patterns: "annual income <= 250000" or "income under ₹5,00,000"
        income_match = re.search(r'(?:annual\s+)?(?:family\s+)?income\s+(?:.*?)\s*[₹Rs\.]*\s*([\d,]+)', sentence, re.IGNORECASE)
        if income_match:
            income_val = income_match.group(1).replace(',', '')
            rules.append({
                'attribute': 'annual_family_income',
                'operator': '<=',
                'value': income_val,
                'description': f"Annual family income must not exceed ₹{income_match.group(1)}",
                'value_type': 'NUMBER'
            })
            continue
        
        # Residency: "resident of", "domicile of", "residing in"
        if re.search(r'(?:resident|domicile|residing|native)\s+(?:of|in)\s+([a-zA-Z\s]+?)(?:\.|,|$)', sentence, re.IGNORECASE):
            resident_match = re.search(r'(?:resident|domicile|residing|native)\s+(?:of|in)\s+([a-zA-Z\s]+?)(?:\.|,|$)', sentence, re.IGNORECASE)
            if resident_match:
                state = resident_match.group(1).strip()
                rules.append({
                    'attribute': 'resident_state',
                    'operator': '=',
                    'value': state,
                    'description': f"Must be a resident of {state}",
                    'value_type': 'STRING'
                })
            continue
        
        # Occupation: "farmer", "student", "fisherman", etc.
        occupations = ['farmer', 'student', 'fisherman', 'fishermen', 'entrepreneur', 'artisan', 'worker', 'laborer']
        for occ in occupations:
            if occ in sentence.lower():
                rules.append({
                    'attribute': 'occupation',
                    'operator': '=',
                    'value': occ.upper(),
                    'description': f"Must be a {occ}",
                    'value_type': 'STRING'
                })
                break
        
        # Category: "SC", "ST", "OBC", "General"
        if re.search(r'scheduled\s+(?:caste|tribe)|\bSC\b|\bST\b', sentence, re.IGNORECASE):
            cat = re.search(r'scheduled\s+(caste|tribe)|\b(SC|ST)\b', sentence, re.IGNORECASE)
            if cat:
                rules.append({
                    'attribute': 'caste_category',
                    'operator': 'IN',
                    'value': 'SC,ST',
                    'description': 'Must belong to Scheduled Caste or Scheduled Tribe',
                    'value_type': 'LIST'
                })
    
    return rules

def parse_documents(documents_text):
    """
    Parse comma or period-separated document names from text.
    """
    if not documents_text:
        return []
    
    # Split by periods and commas
    doc_list = re.split(r'[.,;]', str(documents_text))
    docs = []
    
    for doc in doc_list:
        doc = doc.strip()
        # Remove parenthetical notes and clean up
        doc = re.sub(r'\([^)]*\)', '', doc).strip()
        doc = re.sub(r'\([^)]*\]', '', doc).strip()
        
        # Skip empty or very short entries
        if doc and len(doc) > 3:
            docs.append(doc)
    
    return docs

def import_schemes(file_path):
    """
    Main import function for custom CSV format.
    """
    print(f"📥 Reading dataset file: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
        df = pd.read_excel(file_path)
    elif file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        print("❌ Unsupported file format. Please provide .csv or .xlsx file.")
        return
    
    print(f"📊 Total rows to process: {len(df)}")
    
    success_count = 0
    error_count = 0
    
    for idx, row in df.iterrows():
        try:
            # Use the real slug from the CSV as scheme_id (e.g. pm-kisan)
            slug = str(row.get('slug', '')).strip()
            scheme_id = slug if slug else f"SCHEME_{idx+1:04d}"
            scheme_name = str(row.get('scheme_name', f'Scheme {idx+1}')).strip()

            # Map category
            csv_category = row.get('schemeCategory', 'OTHER')
            category = map_category(csv_category)

            # The 'level' column contains "State"/"Central", not a state name.
            # If it's a state scheme, try to extract the actual state from details.
            level_value = str(row.get('level', '')).strip().lower()
            if level_value == 'state':
                scheme_type = 'STATE'
                applicable_state = extract_state_from_text(
                    row.get('details', ''),
                    'All India'
                )
            else:
                scheme_type = 'CENTRAL'
                applicable_state = 'All India'

            # Construct the real myScheme URL from the slug
            if slug:
                scheme_url = f"https://www.myscheme.gov.in/schemes/{slug}"
            else:
                scheme_url = 'https://www.myscheme.gov.in/'

            # Extract benefits and amount
            benefits_text = str(row.get('benefits', '')).strip()
            benefit_amount = extract_benefit_amount(benefits_text)

            # Create or update scheme
            scheme, created = GovernmentScheme.objects.update_or_create(
                scheme_id=scheme_id,
                defaults={
                    'scheme_name': scheme_name,
                    'category': category,
                    'subcategory': str(row.get('tags', '')).strip()[:100],
                    'ministry': 'Government of India',
                    'scheme_type': scheme_type,
                    'applicable_state': applicable_state,
                    'short_description': scheme_name[:500],
                    'detailed_description': str(row.get('details', '')).strip()[:5000],
                    'objective': str(row.get('eligibility', '')).strip()[:2000],
                    'benefits': benefits_text,
                    'benefit_type': 'FINANCIAL',
                    'benefit_amount': benefit_amount,
                    'application_mode': 'ONLINE',
                    'application_link': scheme_url,
                    'official_website': scheme_url,
                    'is_demo_data': False
                }
            )
            
            # Process eligibility rules
            eligibility_text = str(row.get('eligibility', '')).strip()
            if eligibility_text and eligibility_text.lower() != 'nan':
                # Delete existing rules
                scheme.eligibility_rules.all().delete()
                
                # Parse and create rules
                parsed_rules = parse_eligibility_rules(eligibility_text)
                
                for rule_data in parsed_rules:
                    EligibilityRule.objects.create(
                        scheme=scheme,
                        attribute=rule_data['attribute'],
                        operator=rule_data['operator'],
                        value=rule_data['value'],
                        value_type=rule_data['value_type'],
                        description=rule_data['description'],
                        is_mandatory=True
                    )
                
                # If no rules parsed, create a fallback rule with full eligibility text
                if not parsed_rules:
                    EligibilityRule.objects.create(
                        scheme=scheme,
                        attribute='eligibility_text',
                        operator='=',
                        value='REVIEW_REQUIRED',
                        value_type='STRING',
                        description=eligibility_text[:255],
                        is_mandatory=True
                    )
            
            # Process documents
            documents_text = str(row.get('documents', '')).strip()
            if documents_text and documents_text.lower() != 'nan':
                # Delete existing documents
                scheme.required_documents.all().delete()
                
                # Parse and create documents
                parsed_docs = parse_documents(documents_text)
                
                for doc_name in parsed_docs:
                    RequiredDocument.objects.create(
                        scheme=scheme,
                        document_name=doc_name,
                        is_mandatory=True,
                        description=f"Required document for {scheme_name}"
                    )
            
            success_count += 1
            status = '✅ CREATED' if created else '🔄 UPDATED'
            print(f"[{idx+1:4d}] {status} | {scheme_id}: {scheme_name[:50]}")
        
        except Exception as e:
            error_count += 1
            print(f"[{idx+1:4d}] ❌ ERROR | {str(e)[:100]}")
    
    # Print summary
    print("\n" + "="*80)
    print(f"✅ Import Finished!")
    print(f"   ✓ Successful: {success_count}")
    print(f"   ✗ Errors: {error_count}")
    print(f"   Total: {success_count + error_count}")
    print("="*80)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Import Government Schemes from custom CSV format (scheme_name, schemeCategory, eligibility, details, documents, benefits, application, level)"
    )
    parser.add_argument('--file', required=True, help="Path to CSV or Excel file")
    args = parser.parse_args()
    
    import_schemes(args.file)
