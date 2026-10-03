import os
import base64
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class OCRService:
    """
    Document OCR service using Gemini Vision API.
    Extracts structured profile data from uploaded government documents
    (Aadhaar, Income Certificate, Ration Card, etc.)
    """

    SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    DOCUMENT_PROMPTS = {
        'AADHAAR': """Extract the following fields from this Aadhaar card image. Return ONLY a JSON object with these exact keys (use null if not found):
{
  "document_type": "AADHAAR",
  "full_name": "",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "MALE|FEMALE|OTHER",
  "aadhaar_number_masked": "XXXX-XXXX-1234",
  "address": "",
  "state": "",
  "district": ""
}""",
        'INCOME_CERTIFICATE': """Extract the following fields from this Income Certificate image. Return ONLY a JSON object with these exact keys (use null if not found):
{
  "document_type": "INCOME_CERTIFICATE",
  "full_name": "",
  "annual_family_income": 0,
  "state": "",
  "district": "",
  "caste_category": "GENERAL|OBC|SC|ST|EWS",
  "issue_date": "YYYY-MM-DD",
  "certificate_number": ""
}""",
        'RATION_CARD': """Extract the following fields from this Ration Card image. Return ONLY a JSON object with these exact keys (use null if not found):
{
  "document_type": "RATION_CARD",
  "full_name": "",
  "ration_card_number": "",
  "card_type": "APL|BPL|AAY",
  "state": "",
  "district": "",
  "family_members": []
}""",
        'LAND_RECORD': """Extract the following fields from this Land Record / 7-12 Extract image. Return ONLY a JSON object with these exact keys (use null if not found):
{
  "document_type": "LAND_RECORD",
  "owner_name": "",
  "land_holding_acres": 0,
  "survey_number": "",
  "village": "",
  "district": "",
  "state": "",
  "land_type": ""
}""",
        'GENERAL': """Extract all visible personal information from this government document image. Return ONLY a JSON object with these keys (use null if not found):
{
  "document_type": "UNKNOWN",
  "full_name": "",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "MALE|FEMALE|OTHER",
  "address": "",
  "state": "",
  "district": "",
  "document_number": "",
  "other_fields": {}
}"""
    }

    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')

    def validate_file(self, file):
        errors = []
        if file.size > self.MAX_FILE_SIZE:
            errors.append(f"File too large. Maximum size is {self.MAX_FILE_SIZE // (1024*1024)}MB.")
        if file.content_type not in self.SUPPORTED_TYPES:
            errors.append(f"Unsupported file type '{file.content_type}'. Upload JPEG, PNG, or WebP images.")
        return errors

    def detect_document_type(self, file_bytes):
        """Use Gemini to classify the document type before extraction."""
        if not self.api_key:
            return 'GENERAL'

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')

            response = model.generate_content([
                "Classify this Indian government document image. Reply with ONLY one word from: AADHAAR, INCOME_CERTIFICATE, RATION_CARD, LAND_RECORD, GENERAL",
                {"mime_type": "image/jpeg", "data": file_bytes}
            ])

            doc_type = response.text.strip().upper().replace(' ', '_')
            if doc_type in self.DOCUMENT_PROMPTS:
                return doc_type
            return 'GENERAL'
        except Exception as e:
            logger.warning(f"Document type detection failed: {e}")
            return 'GENERAL'

    def extract_data(self, file, document_hint=None):
        """
        Main OCR extraction method.
        Returns: dict with 'success', 'data', 'document_type', 'confidence', 'profile_updates'
        """
        if not self.api_key:
            return {
                'success': False,
                'error': 'OCR service not configured. Set GEMINI_API_KEY in environment variables.',
                'data': None
            }

        try:
            file_bytes = file.read()
            file.seek(0)

            doc_type = document_hint if document_hint in self.DOCUMENT_PROMPTS else None
            if not doc_type:
                doc_type = self.detect_document_type(file_bytes)

            prompt = self.DOCUMENT_PROMPTS.get(doc_type, self.DOCUMENT_PROMPTS['GENERAL'])

            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')

            mime_type = file.content_type or 'image/jpeg'
            response = model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": file_bytes}
            ])

            raw_text = response.text.strip()
            # Clean markdown code blocks if present
            if raw_text.startswith('```'):
                raw_text = raw_text.split('\n', 1)[1] if '\n' in raw_text else raw_text[3:]
                if raw_text.endswith('```'):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()

            import json
            extracted = json.loads(raw_text)

            profile_updates = self._map_to_profile_fields(extracted)

            return {
                'success': True,
                'document_type': doc_type,
                'data': extracted,
                'profile_updates': profile_updates,
                'raw_text': raw_text
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini OCR response as JSON: {e}")
            return {
                'success': False,
                'error': 'Failed to parse extracted data. Please try a clearer image.',
                'data': None,
                'raw_response': raw_text if 'raw_text' in dir() else None
            }
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return {
                'success': False,
                'error': f'Document scanning failed: {str(e)}',
                'data': None
            }

    def _map_to_profile_fields(self, extracted):
        """Map extracted OCR data to UserProfile model fields."""
        mapping = {}

        if extracted.get('full_name') or extracted.get('owner_name'):
            mapping['full_name'] = extracted.get('full_name') or extracted.get('owner_name')

        if extracted.get('date_of_birth'):
            mapping['date_of_birth'] = extracted['date_of_birth']

        if extracted.get('gender'):
            gender = extracted['gender'].upper()
            if gender in ('MALE', 'FEMALE', 'OTHER', 'TRANSGENDER'):
                mapping['gender'] = gender

        if extracted.get('state'):
            mapping['state'] = extracted['state']

        if extracted.get('district'):
            mapping['district'] = extracted['district']

        if extracted.get('annual_family_income'):
            try:
                mapping['annual_family_income'] = float(extracted['annual_family_income'])
            except (ValueError, TypeError):
                pass

        if extracted.get('caste_category'):
            cat = extracted['caste_category'].upper()
            if cat in ('GENERAL', 'OBC', 'SC', 'ST', 'EWS'):
                mapping['caste_category'] = cat

        if extracted.get('land_holding_acres'):
            try:
                mapping['land_holding_acres'] = float(extracted['land_holding_acres'])
                mapping['land_ownership'] = True
                mapping['is_farmer'] = True
            except (ValueError, TypeError):
                pass

        if extracted.get('card_type') == 'BPL':
            mapping['bpl_card_holder'] = True

        return mapping
