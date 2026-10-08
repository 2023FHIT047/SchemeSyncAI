import os
import re
import io
import logging
import numpy as np
import cv2
import pytesseract
from django.conf import settings

logger = logging.getLogger(__name__)


def _find_tesseract_cmd():
    """Locate the Tesseract binary across common install paths."""
    try:
        settings_cmd = getattr(settings, 'TESSERACT_CMD', None)
    except Exception:
        settings_cmd = None
    candidates = [
        os.environ.get('TESSERACT_CMD'),
        settings_cmd,
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        os.path.expandvars(r'%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe'),
        '/usr/bin/tesseract',
        '/usr/local/bin/tesseract',
        '/opt/homebrew/bin/tesseract',
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return 'tesseract'


pytesseract.pytesseract.tesseract_cmd = _find_tesseract_cmd()


class OCRService:
    """
    Offline document OCR service using OpenCV preprocessing + Tesseract.
    Extracts raw text, then parses structured fields with regex per document type.
    No external API or key required.
    """

    SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic',
                       'image/jpg', 'image/bmp', 'image/tiff', 'application/pdf']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    INDIAN_STATES = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
    ]

    def validate_file(self, file):
        errors = []
        if file.size > self.MAX_FILE_SIZE:
            errors.append(f"File too large. Maximum size is {self.MAX_FILE_SIZE // (1024*1024)}MB.")
        ct = (file.content_type or '').lower()
        if ct and ct not in self.SUPPORTED_TYPES:
            errors.append(f"Unsupported file type '{file.content_type}'. Upload a JPEG, PNG, or WebP image.")
        return errors

    # ------------------------------------------------------------------
    # OpenCV image preprocessing
    # ------------------------------------------------------------------
    def _load_image(self, file_bytes):
        arr = np.frombuffer(file_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not read the image file. It may be corrupted or in an unsupported format.")
        return img

    def _deskew(self, gray):
        """Straighten a tilted document so Tesseract reads lines correctly."""
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 50:
            return gray
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        else:
            angle = -angle
        if abs(angle) < 0.5 or abs(angle) > 20:
            return gray
        (h, w) = gray.shape[:2]
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)

    def _process_image(self, img):
        """OpenCV pipeline: grayscale -> upscale -> denoise -> deskew -> adaptive threshold."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # Upscale small images (Tesseract prefers ~300 DPI / large text)
        h, w = gray.shape
        if max(h, w) < 1200:
            scale = 1400 / max(h, w)
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        gray = cv2.fastNlMeansDenoising(gray, None, h=10)
        gray = self._deskew(gray)

        # Adaptive threshold handles colored backgrounds & uneven lighting (Aadhaar/PAN)
        processed = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 10
        )
        # Light dilation reconnects broken character strokes
        kernel = np.ones((2, 2), np.uint8)
        processed = cv2.dilate(processed, kernel, iterations=1)
        return processed

    def _preprocess(self, file_bytes):
        return self._process_image(self._load_image(file_bytes))

    def _pixmap_to_cv(self, pix):
        """Convert a PyMuPDF pixmap to a BGR numpy array."""
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            return cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
        if pix.n == 3:
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        return cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)

    def _process_pdf(self, file_bytes):
        """
        Extract text from a PDF. Uses the embedded text layer when present
        (born-digital PDFs — 100% accurate); falls back to OCR per page for
        scanned/image-only PDFs.
        """
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise ValueError("PDF support requires PyMuPDF. Install it with: pip install PyMuPDF")

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception:
            raise ValueError("Could not open the PDF. It may be corrupted or password-protected.")

        texts = []
        for page in doc:
            direct = page.get_text().strip()
            if len(direct) >= 20:
                texts.append(direct)
            else:
                pix = page.get_pixmap(dpi=300)
                img = self._pixmap_to_cv(pix)
                texts.append(self._extract_text(self._process_image(img)))
        doc.close()

        combined = "\n".join(t for t in texts if t).strip()
        if not combined:
            raise ValueError("No readable text found in the PDF. If it is a scan, ensure it is clear and well-lit.")
        return combined

    def _ocr_pass(self, image, psm):
        """Run Tesseract with a given PSM; return (text, mean_confidence)."""
        config = f'--oem 3 --psm {psm}'
        try:
            text = pytesseract.image_to_string(image, config=config)
            data = pytesseract.image_to_data(image, config=config,
                                             output_type=pytesseract.Output.DICT)
        except pytesseract.TesseractNotFoundError:
            raise ValueError(
                "Tesseract OCR engine is not installed. Install it from "
                "https://github.com/UB-Mannheim/tesseract/wiki and restart the server."
            )
        confs = [float(c) for c, t in zip(data.get('conf', []), data.get('text', []))
                 if t and t.strip() and float(c) > 0]
        mean_conf = sum(confs) / len(confs) if confs else 0.0
        return (text or ''), mean_conf

    def _extract_text(self, image):
        """Try several page-segmentation modes; keep the highest-confidence result."""
        best_text, best_conf = '', -1.0
        for psm in (6, 3, 4, 11):
            text, conf = self._ocr_pass(image, psm)
            if conf > best_conf:
                best_text, best_conf = text, conf
        logger.info(f"OCR best confidence: {best_conf:.1f}")
        return best_text

    # ------------------------------------------------------------------
    # Document type detection
    # ------------------------------------------------------------------
    def detect_document_type(self, text):
        low = text.lower()
        # PAN — very specific regex/keywords
        if ('permanent account number' in low or 'income tax department' in low
                or re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', text)):
            return 'PAN_CARD'
        # Disability (check before Aadhaar — UDID cards also carry Aadhaar-style text)
        if any(k in low for k in ['disability', 'udid', 'person with disability',
                                  'benchmark disability', 'pwbd']):
            return 'DISABILITY_CERTIFICATE'
        # Caste certificate
        if any(k in low for k in ['caste certificate', 'scheduled caste', 'scheduled tribe',
                                  'other backward', 'caste validity']):
            return 'CASTE_CERTIFICATE'
        # Domicile / residence
        if any(k in low for k in ['domicile', 'residence certificate', 'residential certificate']):
            return 'DOMICILE_CERTIFICATE'
        # Birth certificate
        if any(k in low for k in ['birth certificate', 'certificate of birth', 'place of birth']):
            return 'BIRTH_CERTIFICATE'
        # Educational marksheet
        if any(k in low for k in ['marksheet', 'mark sheet', 'statement of marks',
                                  'secondary school certificate', 'higher secondary',
                                  'cgpa', 'grade point', 'board of examination']):
            return 'EDUCATION_MARKSHEET'
        # Bank passbook
        if any(k in low for k in ['passbook', 'ifsc', 'account number', 'account no',
                                  'savings bank', 'current account']):
            return 'BANK_PASSBOOK'
        if any(k in low for k in ['aadhaar', 'आधार', 'unique identification', 'uidai']):
            return 'AADHAAR'
        if any(k in low for k in ['income certificate', 'annual income', 'annual family income']):
            return 'INCOME_CERTIFICATE'
        if any(k in low for k in ['ration card', 'fair price', 'aay', ' bpl', 'apl card']):
            return 'RATION_CARD'
        if any(k in low for k in ['7/12', 'land record', 'survey no', 'survey number',
                                  'khasra', 'village', 'acre', 'roit', 'ferfar']):
            return 'LAND_RECORD'
        return 'GENERAL'

    # ------------------------------------------------------------------
    # Shared field finders
    # ------------------------------------------------------------------
    def _find_state(self, text):
        for state in self.INDIAN_STATES:
            if re.search(re.escape(state), text, re.IGNORECASE):
                return state.title()
        return None

    def _find_gender(self, text):
        low = text.lower()
        if re.search(r'\bfemale\b|\bwoman\b', low):
            return 'FEMALE'
        if re.search(r'\bmale\b', low):
            return 'MALE'
        if 'transgender' in low:
            return 'TRANSGENDER'
        return None

    def _normalize_date(self, raw):
        if not raw:
            return None
        parts = re.split(r'[/\-.]', raw.strip())
        if len(parts) != 3:
            return None
        d, mo, y = parts
        if not (d.isdigit() and mo.isdigit() and y.isdigit()):
            return None
        if len(y) == 2:
            y = '20' + y if int(y) < 30 else '19' + y
        try:
            return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
        except ValueError:
            return None

    def _find_dob(self, text):
        m = re.search(r'(?:d\.?\s?o\.?\s?b\.?|date of birth|birth|dob)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})',
                      text, re.IGNORECASE)
        if m:
            norm = self._normalize_date(m.group(1))
            if norm:
                return norm
        m = re.search(r'\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\b', text)
        if m:
            norm = self._normalize_date(m.group(1))
            if norm:
                return norm
        m = re.search(r'(?:year of birth|yob|birth)[:\s]*(\d{4})', text, re.IGNORECASE)
        if m:
            return f"{m.group(1)}-01-01"
        return None

    def _find_income(self, text):
        patterns = [
            r'(?:annual|yearly|family)?\s*income[^0-9₹]{0,20}(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d+)?)',
            r'(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d+)?)',
        ]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                try:
                    num = float(m.group(1).replace(',', ''))
                    if num >= 1000:
                        return num
                except ValueError:
                    continue
        return None

    def _find_caste(self, text):
        low = text.lower()
        if re.search(r'\bscheduled tribe\b|\bst\b', low):
            return 'ST'
        if re.search(r'\bscheduled caste\b|\bsc\b', low):
            return 'SC'
        if re.search(r'\bobc\b|other backward', low):
            return 'OBC'
        if re.search(r'\bews\b|economically weaker', low):
            return 'EWS'
        if re.search(r'\bgeneral\b', low):
            return 'GENERAL'
        return None

    NOISE_WORDS = ['government', 'india', 'unique', 'identification', 'authority',
                   'certificate', 'aadhaar', 'ration', 'record', 'district', 'state',
                   'taluka', 'tehsil', 'village', 'uidai', 'www.', 'http', 'income tax',
                   'department', 'permanent', 'account', 'number', 'signature', 'father',
                   "father's", 'name', 'birth', 'date', 'card']

    def _looks_like_name(self, line, noise=None):
        noise = noise or self.NOISE_WORDS
        if not line or len(line) < 3 or len(line) > 60:
            return False
        low = line.lower()
        if any(n in low for n in noise):
            return False
        if re.search(r'\d', line):
            return False
        words = re.findall(r"[A-Za-z]{2,}", line)
        if len(words) < 2:
            return False
        letters = sum(c.isalpha() or c.isspace() for c in line)
        return letters / len(line) > 0.75

    def _find_name(self, text):
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        # Value on the line after a "Name" label (PAN/certificate layout)
        for i, line in enumerate(lines):
            if re.match(r'^(name|full name|applicant name|holder name)[:\s]*$', line.lower()):
                for nxt in lines[i + 1:i + 3]:
                    if self._looks_like_name(nxt):
                        return nxt
        # Aadhaar "To," layout
        for i, line in enumerate(lines):
            if re.match(r'^to,?\s*$', line.lower()):
                for nxt in lines[i + 1:i + 3]:
                    if self._looks_like_name(nxt):
                        return nxt
        # S/O, D/O, W/O markers
        for i, line in enumerate(lines):
            if re.search(r'\b[sdwc]/o\b|\bson of\b|\bdaughter of\b|\bwife of\b', line, re.IGNORECASE):
                candidate = re.split(r"\b[sdwc]/o\b|\bson of\b|\bdaughter of\b|\bwife of\b",
                                     line, flags=re.IGNORECASE)[0].strip()
                if self._looks_like_name(candidate):
                    return candidate
                if i > 0 and self._looks_like_name(lines[i - 1]):
                    return lines[i - 1]
        for line in lines:
            if self._looks_like_name(line):
                return line
        return None

    def _find_label_value(self, text, label):
        """Value appearing on the line right after a label (e.g. 'Father's Name')."""
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for i, line in enumerate(lines):
            if re.match(rf'^{label}[:\s]*$', line, re.IGNORECASE):
                if i + 1 < len(lines):
                    return lines[i + 1]
            m = re.match(rf'^{label}[:\s]+(.+)$', line, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return None

    # ------------------------------------------------------------------
    # Per-document parsers
    # ------------------------------------------------------------------
    def _parse_pancard(self, text):
        data = {'document_type': 'PAN_CARD'}
        m = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', text.upper())
        if m:
            data['pan_number'] = m.group(1)
        data['full_name'] = self._find_name(text)
        father = self._find_label_value(text, r"father'?s? name|name of father")
        if father and self._looks_like_name(father):
            data['father_name'] = father
        data['date_of_birth'] = self._find_dob(text)
        return data

    def _parse_aadhaar(self, text):
        data = {'document_type': 'AADHAAR'}
        data['full_name'] = self._find_name(text)
        data['date_of_birth'] = self._find_dob(text)
        data['gender'] = self._find_gender(text)
        data['state'] = self._find_state(text)
        m = re.search(r'\b(\d{4})\s?(\d{4})\s?(\d{4})\b', text)
        if m:
            data['aadhaar_number_masked'] = f"XXXX-XXXX-{m.group(3)}"
        m = re.search(r'address[:\s]*([^\n]+)', text, re.IGNORECASE)
        if m:
            data['address'] = m.group(1).strip()[:120]
        m = re.search(r'\b([1-9][0-9]{5})\b', text)
        if m:
            data['pincode'] = m.group(1)
        return data

    def _parse_income_certificate(self, text):
        data = {'document_type': 'INCOME_CERTIFICATE'}
        data['full_name'] = self._find_name(text)
        data['annual_family_income'] = self._find_income(text)
        data['caste_category'] = self._find_caste(text)
        data['state'] = self._find_state(text)
        m = re.search(r'certificate\s*(?:no|number|num)[:.\s#]*([A-Za-z0-9/\-]+)', text, re.IGNORECASE)
        if m:
            data['certificate_number'] = m.group(1)
        m = re.search(r'(?:issue|issued|date)[:\s]*([^\n]+)', text, re.IGNORECASE)
        if m:
            data['issue_date'] = self._normalize_date(m.group(1)) or m.group(1).strip()[:20]
        return data

    def _parse_ration_card(self, text):
        data = {'document_type': 'RATION_CARD'}
        data['full_name'] = self._find_name(text)
        data['state'] = self._find_state(text)
        m = re.search(r'(?:card|ration)\s*(?:no|number)[:.\s#]*([A-Za-z0-9/\-]+)', text, re.IGNORECASE)
        if m:
            data['ration_card_number'] = m.group(1)
        low = text.lower()
        if 'aay' in low:
            data['card_type'] = 'AAY'
        elif re.search(r'\bbpl\b', low):
            data['card_type'] = 'BPL'
        elif re.search(r'\bapl\b', low):
            data['card_type'] = 'APL'
        return data

    def _parse_land_record(self, text):
        data = {'document_type': 'LAND_RECORD'}
        data['owner_name'] = self._find_name(text)
        data['state'] = self._find_state(text)
        m = re.search(r'([\d.]+)\s*(?:acre|acres|ac\b)', text, re.IGNORECASE)
        if m:
            try:
                data['land_holding_acres'] = float(m.group(1))
            except ValueError:
                pass
        m = re.search(r'(?:survey|gat|khasra)\s*(?:no|number)?[:.\s#]*([0-9A-Za-z/\-]+)', text, re.IGNORECASE)
        if m:
            data['survey_number'] = m.group(1)
        m = re.search(r'village[:\s]*([A-Za-z ]+)', text, re.IGNORECASE)
        if m:
            data['village'] = m.group(1).strip()[:50]
        return data

    def _parse_general(self, text):
        data = {'document_type': 'UNKNOWN'}
        m = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', text.upper())
        if m:
            data['pan_number'] = m.group(1)
        data['full_name'] = self._find_name(text)
        data['date_of_birth'] = self._find_dob(text)
        data['gender'] = self._find_gender(text)
        data['state'] = self._find_state(text)
        data['caste_category'] = self._find_caste(text)
        data['annual_family_income'] = self._find_income(text)
        return data

    def _detect_education_level(self, text):
        low = text.lower()
        if re.search(r'\bph\.?\s?d\b|doctorate', low):
            return 'DOCTORATE'
        if re.search(r'master|post.?graduate|\bm\.?a\b|\bm\.?sc\b|\bm\.?com\b|\bmba\b|\bm\.?e\b|\bm\.?tech\b', low):
            return 'POST_GRADUATE'
        if re.search(r'bachelor|graduate|\bb\.?a\b|\bb\.?sc\b|\bb\.?com\b|\bb\.?e\b|\bb\.?tech\b|\bbca\b|\bbba\b', low):
            return 'GRADUATE'
        if re.search(r'diploma|\biti\b|polytechnic', low):
            return 'DIPLOMA'
        if re.search(r'higher secondary|\b12th\b|hsc|intermediate|senior secondary', low):
            return '12TH_PASS'
        if re.search(r'secondary|\b10th\b|sslc|sslc|matriculation|matric', low):
            return '10TH_PASS'
        return None

    def _parse_caste_certificate(self, text):
        data = {'document_type': 'CASTE_CERTIFICATE'}
        data['full_name'] = self._find_name(text)
        data['caste_category'] = self._find_caste(text)
        data['state'] = self._find_state(text)
        m = re.search(r'caste\s*:\s*([A-Za-z ]+)', text, re.IGNORECASE)
        if m and 'certificate' not in m.group(1).lower():
            data['caste_name'] = m.group(1).strip()[:40]
        m = re.search(r'certificate\s*(?:no|number)[:.\s#]*([A-Za-z0-9/\-]+)', text, re.IGNORECASE)
        if m:
            data['certificate_number'] = m.group(1)
        m = re.search(r'(?:issue|issued|date)[:\s]*([^\n]+)', text, re.IGNORECASE)
        if m:
            data['issue_date'] = self._normalize_date(m.group(1)) or m.group(1).strip()[:20]
        return data

    def _parse_domicile_certificate(self, text):
        data = {'document_type': 'DOMICILE_CERTIFICATE'}
        data['full_name'] = self._find_name(text)
        data['state'] = self._find_state(text)
        m = re.search(r'district[:\s]+([A-Za-z ]+)', text, re.IGNORECASE)
        if m:
            data['district'] = m.group(1).strip()[:40]
        m = re.search(r'address[:\s]*([^\n]+)', text, re.IGNORECASE)
        if m:
            data['address'] = m.group(1).strip()[:120]
        m = re.search(r'certificate\s*(?:no|number)[:.\s#]*([A-Za-z0-9/\-]+)', text, re.IGNORECASE)
        if m:
            data['certificate_number'] = m.group(1)
        return data

    def _parse_birth_certificate(self, text):
        data = {'document_type': 'BIRTH_CERTIFICATE'}
        data['full_name'] = self._find_label_value(text, r"name of child|child'?s? name|name") or self._find_name(text)
        data['date_of_birth'] = self._find_dob(text)
        data['gender'] = self._find_gender(text)
        father = self._find_label_value(text, r"father'?s? name|name of father")
        if father and self._looks_like_name(father):
            data['father_name'] = father
        mother = self._find_label_value(text, r"mother'?s? name|name of mother")
        if mother and self._looks_like_name(mother):
            data['mother_name'] = mother
        m = re.search(r'place of birth[:\s]+([^\n]+)', text, re.IGNORECASE)
        if m:
            data['place_of_birth'] = m.group(1).strip()[:60]
        m = re.search(r'registration\s*(?:no|number)[:.\s#]*([A-Za-z0-9/\-]+)', text, re.IGNORECASE)
        if m:
            data['registration_number'] = m.group(1)
        return data

    def _parse_disability_certificate(self, text):
        data = {'document_type': 'DISABILITY_CERTIFICATE'}
        data['full_name'] = self._find_name(text)
        data['date_of_birth'] = self._find_dob(text)
        data['gender'] = self._find_gender(text)
        data['is_disabled'] = True
        m = re.search(r'(\d{1,3})\s*%', text)
        if m:
            pct = int(m.group(1))
            if 1 <= pct <= 100:
                data['disability_percentage'] = pct
        m = re.search(r'(?:type of disability|disability)\s*:\s*([A-Za-z \-]+)', text, re.IGNORECASE)
        if m and 'certificate' not in m.group(1).lower():
            data['disability_type'] = m.group(1).strip()[:50]
        m = re.search(r'\b([0-9]{6,}|[A-Z]{2,}[0-9]{6,})\b', text)
        if m:
            data['udid_number'] = m.group(1)
        return data

    def _parse_education_marksheet(self, text):
        data = {'document_type': 'EDUCATION_MARKSHEET'}
        data['full_name'] = self._find_name(text)
        data['education_level'] = self._detect_education_level(text)
        m = re.search(r'([^\n]*\b(?:board|university|institution|college)\b[^\n]*)', text, re.IGNORECASE)
        if m:
            data['board_university'] = m.group(1).strip()[:80]
        m = re.search(r'(?:roll|enrol|registration|seat)\s*(?:no|number)[:.\s#]*([A-Za-z0-9/\-]+)', text, re.IGNORECASE)
        if m:
            data['roll_number'] = m.group(1)
        m = re.search(r'(?:cgpa|gpa|percentage|result)[:\s]*([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*%?', text, re.IGNORECASE)
        if m:
            data['score'] = m.group(1)
        m = re.search(r'(?:year of passing|passing year|session|year)[:\s]*(\d{4})', text, re.IGNORECASE)
        if m:
            data['year_of_passing'] = m.group(1)
        return data

    def _parse_bank_passbook(self, text):
        data = {'document_type': 'BANK_PASSBOOK'}
        data['full_name'] = self._find_label_value(text, r"account holder'?s? name|name of account holder|customer name|name") or self._find_name(text)
        m = re.search(r'(?:account|a/c)\s*(?:no\.?|number)\s*[:#]?\s*([0-9A-Za-z]{6,20})', text, re.IGNORECASE)
        if m:
            data['account_number'] = m.group(1)
        m = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', text.upper())
        if m:
            data['ifsc_code'] = m.group(1)
        for line in text.splitlines():
            low = line.lower().strip()
            if not low:
                continue
            if 'bank' in low and not any(w in low for w in ['account', 'branch', 'passbook', 'ifsc']):
                data.setdefault('bank_name', line.strip()[:60])
            if low.startswith('branch') or ' branch' in low:
                mv = re.search(r'branch[:\s]+([^\n]+)', line, re.IGNORECASE)
                if mv:
                    data.setdefault('branch', mv.group(1).strip()[:60])
        return data

    PARSERS = {
        'AADHAAR': '_parse_aadhaar',
        'PAN_CARD': '_parse_pancard',
        'INCOME_CERTIFICATE': '_parse_income_certificate',
        'RATION_CARD': '_parse_ration_card',
        'LAND_RECORD': '_parse_land_record',
        'CASTE_CERTIFICATE': '_parse_caste_certificate',
        'DOMICILE_CERTIFICATE': '_parse_domicile_certificate',
        'BIRTH_CERTIFICATE': '_parse_birth_certificate',
        'DISABILITY_CERTIFICATE': '_parse_disability_certificate',
        'EDUCATION_MARKSHEET': '_parse_education_marksheet',
        'BANK_PASSBOOK': '_parse_bank_passbook',
        'GENERAL': '_parse_general',
    }

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------
    def extract_data(self, file, document_hint=None):
        try:
            file_bytes = file.read()
            file.seek(0)

            is_pdf = (
                (file.content_type or '').lower() == 'application/pdf'
                or (getattr(file, 'name', '') or '').lower().endswith('.pdf')
                or file_bytes[:4] == b'%PDF'
            )

            if is_pdf:
                raw_text = self._process_pdf(file_bytes)
            else:
                image = self._preprocess(file_bytes)
                raw_text = self._extract_text(image)

            if not raw_text or len(raw_text.strip()) < 5:
                return {
                    'success': False,
                    'error': 'No readable text found. Please upload a clear, well-lit, straight photo of the document.',
                    'data': None,
                }

            doc_type = document_hint if document_hint in self.PARSERS else self.detect_document_type(raw_text)
            parser = getattr(self, self.PARSERS[doc_type])
            extracted = parser(raw_text)
            extracted = {k: v for k, v in extracted.items() if v not in (None, '', [])}

            profile_updates = self._map_to_profile_fields(extracted)

            return {
                'success': True,
                'document_type': doc_type,
                'data': extracted,
                'profile_updates': profile_updates,
                'raw_text': raw_text.strip()[:2000],
            }

        except ValueError as e:
            return {'success': False, 'error': str(e), 'data': None}
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}", exc_info=True)
            return {'success': False, 'error': f'Document scanning failed: {str(e)}', 'data': None}

    def _map_to_profile_fields(self, extracted):
        """Map extracted OCR data to UserProfile model fields."""
        mapping = {}

        name = extracted.get('full_name') or extracted.get('owner_name')
        if name and isinstance(name, str) and len(name.strip()) > 1:
            mapping['full_name'] = name.strip()

        dob = extracted.get('date_of_birth')
        if dob and isinstance(dob, str) and dob.lower() != 'null' and len(dob) >= 8:
            mapping['date_of_birth'] = dob

        gender = extracted.get('gender')
        if gender and isinstance(gender, str):
            gender = gender.upper().strip()
            if gender in ('MALE', 'FEMALE', 'OTHER', 'TRANSGENDER'):
                mapping['gender'] = gender

        state = extracted.get('state')
        if state and isinstance(state, str) and len(state.strip()) > 1:
            mapping['state'] = state.strip()

        district = extracted.get('district')
        if district and isinstance(district, str) and len(district.strip()) > 1:
            mapping['district'] = district.strip()

        income = extracted.get('annual_family_income')
        if income:
            try:
                val = float(income)
                if val > 0:
                    mapping['annual_family_income'] = val
            except (ValueError, TypeError):
                pass

        caste = extracted.get('caste_category')
        if caste and isinstance(caste, str):
            cat = caste.upper().strip()
            if cat in ('GENERAL', 'OBC', 'SC', 'ST', 'EWS'):
                mapping['caste_category'] = cat

        education = extracted.get('education_level')
        if education and isinstance(education, str):
            edu = education.upper().strip()
            valid_edu = ('BELOW_10TH', '10TH_PASS', '12TH_PASS', 'DIPLOMA',
                         'GRADUATE', 'POST_GRADUATE', 'DOCTORATE', 'OTHER')
            if edu in valid_edu:
                mapping['education_level'] = edu

        if extracted.get('is_disabled'):
            mapping['is_disabled'] = True

        disability_pct = extracted.get('disability_percentage')
        if disability_pct:
            try:
                val = int(disability_pct)
                if 1 <= val <= 100:
                    mapping['disability_percentage'] = val
                    mapping['is_disabled'] = True
            except (ValueError, TypeError):
                pass

        land = extracted.get('land_holding_acres')
        if land:
            try:
                val = float(land)
                if val > 0:
                    mapping['land_holding_acres'] = val
                    mapping['land_ownership'] = True
                    mapping['is_farmer'] = True
            except (ValueError, TypeError):
                pass

        card_type = extracted.get('card_type')
        if card_type and isinstance(card_type, str) and card_type.upper() in ('BPL', 'AAY'):
            mapping['bpl_card_holder'] = True

        return mapping
