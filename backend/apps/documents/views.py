import re

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from .models import RequiredDocument, UserDocument, DocumentType
from apps.schemes.models import GovernmentScheme
from apps.schemes.serializers import RequiredDocumentSerializer
from ai.ocr_service import OCRService


# Ordered keyword -> candidate vault document type(s) map used to match
# free-text RequiredDocument.document_name entries to typed vault documents.
# A requirement counts as ready when ANY of its candidate types is in the vault.
READINESS_KEYWORD_MAP = [
    ('aadhaar', (DocumentType.AADHAAR,)),
    ('aadhar', (DocumentType.AADHAAR,)),
    ('pan card', (DocumentType.PAN_CARD,)),
    ('income certificate', (DocumentType.INCOME_CERTIFICATE,)),
    ('income proof', (DocumentType.INCOME_CERTIFICATE,)),
    ('ration card', (DocumentType.RATION_CARD,)),
    ('ration', (DocumentType.RATION_CARD,)),
    ('bpl card', (DocumentType.RATION_CARD,)),
    ('7/12', (DocumentType.LAND_RECORD,)),
    ('land record', (DocumentType.LAND_RECORD,)),
    ('land document', (DocumentType.LAND_RECORD,)),
    ('land ownership', (DocumentType.LAND_RECORD,)),
    ('landholding', (DocumentType.LAND_RECORD,)),
    ('land holding', (DocumentType.LAND_RECORD,)),
    ('land papers', (DocumentType.LAND_RECORD,)),
    ('caste certificate', (DocumentType.CASTE_CERTIFICATE,)),
    ('caste', (DocumentType.CASTE_CERTIFICATE,)),
    ('domicile', (DocumentType.DOMICILE_CERTIFICATE,)),
    ('residence certificate', (DocumentType.DOMICILE_CERTIFICATE,)),
    ('proof of residence', (DocumentType.DOMICILE_CERTIFICATE,)),
    ('residence proof', (DocumentType.DOMICILE_CERTIFICATE,)),
    ('address proof', (DocumentType.DOMICILE_CERTIFICATE, DocumentType.AADHAAR)),
    ('proof of address', (DocumentType.DOMICILE_CERTIFICATE, DocumentType.AADHAAR)),
    ('birth certificate', (DocumentType.BIRTH_CERTIFICATE,)),
    ('date of birth', (DocumentType.BIRTH_CERTIFICATE, DocumentType.EDUCATION_MARKSHEET)),
    ('age proof', (DocumentType.BIRTH_CERTIFICATE, DocumentType.EDUCATION_MARKSHEET)),
    ('proof of age', (DocumentType.BIRTH_CERTIFICATE, DocumentType.EDUCATION_MARKSHEET)),
    ('identity proof', (DocumentType.AADHAAR, DocumentType.PAN_CARD)),
    ('proof of identity', (DocumentType.AADHAAR, DocumentType.PAN_CARD)),
    ('disability', (DocumentType.DISABILITY_CERTIFICATE,)),
    ('marksheet', (DocumentType.EDUCATION_MARKSHEET,)),
    ('mark sheet', (DocumentType.EDUCATION_MARKSHEET,)),
    ('10th', (DocumentType.EDUCATION_MARKSHEET,)),
    ('12th', (DocumentType.EDUCATION_MARKSHEET,)),
    ('degree certificate', (DocumentType.EDUCATION_MARKSHEET,)),
    ('bank passbook', (DocumentType.BANK_PASSBOOK,)),
    ('passbook', (DocumentType.BANK_PASSBOOK,)),
    ('pass book', (DocumentType.BANK_PASSBOOK,)),
    ('bank account', (DocumentType.BANK_PASSBOOK,)),
    ('bank details', (DocumentType.BANK_PASSBOOK,)),
    ('bank statement', (DocumentType.BANK_PASSBOOK,)),
    ('cancelled cheque', (DocumentType.BANK_PASSBOOK,)),
]


def match_required_document_types(document_name):
    """Map a free-text required-document name to candidate vault DocumentTypes."""
    if not document_name:
        return ()
    lowered = document_name.lower()
    for keyword, doc_types in READINESS_KEYWORD_MAP:
        if keyword in lowered:
            return doc_types
    return ()


class DocumentListView(generics.ListCreateAPIView):
    queryset = RequiredDocument.objects.all()
    serializer_class = RequiredDocumentSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        queryset = RequiredDocument.objects.all()
        scheme_id = self.request.query_params.get('scheme_id', None)
        if scheme_id:
            queryset = queryset.filter(scheme__scheme_id=scheme_id)
        return queryset


class DocumentScanView(APIView):
    """
    POST /api/documents/scan/
    Upload a government document image to extract structured data via OCR.
    Accepts: multipart/form-data with 'file' field and optional 'document_type' hint.
    On success the extracted document is saved into the user's vault.
    """
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        ocr_service = OCRService()

        file = request.FILES.get('file')
        if not file:
            return Response(
                {'success': False, 'error': 'No file uploaded. Please attach a document image.'},
                status=400
            )

        validation_errors = ocr_service.validate_file(file)
        if validation_errors:
            return Response(
                {'success': False, 'error': ' '.join(validation_errors)},
                status=400
            )

        document_hint = request.data.get('document_type', None)
        if document_hint:
            document_hint = document_hint.upper()

        result = ocr_service.extract_data(file, document_hint=document_hint)

        if not result['success']:
            return Response(result, status=422)

        # Store the scanned document in the user's vault (one per type, latest wins).
        doc_type = result.get('document_type')
        valid_types = {choice for choice, _ in DocumentType.choices}
        if not doc_type or doc_type == 'UNKNOWN' or doc_type not in valid_types:
            doc_type = DocumentType.GENERAL

        previous = UserDocument.objects.filter(user=request.user, document_type=doc_type).first()
        if previous and previous.file:
            previous.file.delete(save=False)

        vault_doc, _ = UserDocument.objects.update_or_create(
            user=request.user,
            document_type=doc_type,
            defaults={
                'file': file,
                'file_name': file.name[:255],
                'extracted_data': result.get('data') or {},
            },
        )
        result['vault_saved'] = True
        result['vault_document_id'] = vault_doc.id
        result['vault_document_type'] = doc_type
        return Response(result, status=200)


class MyDocumentListView(APIView):
    """GET /api/documents/mine/ — list the current user's vault documents."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        docs = UserDocument.objects.filter(user=request.user)
        data = [
            {
                'id': doc.id,
                'document_type': doc.document_type,
                'document_type_label': doc.get_document_type_display(),
                'file_name': doc.file_name,
                'has_file': bool(doc.file),
                'extracted_data': doc.extracted_data,
                'updated_at': doc.updated_at,
            }
            for doc in docs
        ]
        return Response({'count': len(data), 'results': data})


class MyDocumentFileView(APIView):
    """GET /api/documents/mine/<id>/file/ — view/download the stored document file."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        doc = get_object_or_404(UserDocument, pk=pk, user=request.user)
        if not doc.file:
            return Response({'error': 'No file is stored for this document.'}, status=404)
        return FileResponse(
            doc.file.open('rb'),
            as_attachment=False,
            filename=doc.file_name or 'document',
        )


class MyDocumentDeleteView(APIView):
    """DELETE /api/documents/mine/<id>/ — remove a document from the vault."""
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, pk):
        doc = get_object_or_404(UserDocument, pk=pk, user=request.user)
        if doc.file:
            doc.file.delete(save=False)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SchemeReadinessView(APIView):
    """GET /api/documents/readiness/<scheme_id>/
    Compare a scheme's required documents against the user's vault."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, scheme_id):
        scheme = get_object_or_404(GovernmentScheme, scheme_id=scheme_id)
        required = RequiredDocument.objects.filter(scheme=scheme)
        vault = {doc.document_type: doc for doc in UserDocument.objects.filter(user=request.user)}

        documents = []
        seen_names = set()
        for req in required:
            name = (req.document_name or '').strip()
            dedupe_key = re.sub(r'\s+', ' ', name).lower()
            if not dedupe_key or dedupe_key in seen_names:
                continue
            seen_names.add(dedupe_key)

            candidate_types = match_required_document_types(name)
            vault_doc = next((vault[t] for t in candidate_types if t in vault), None)

            documents.append({
                'required_document_id': req.id,
                'document_name': name[:160],
                'is_mandatory': req.is_mandatory,
                'description': req.description,
                'matched_type': candidate_types[0] if candidate_types else None,
                'matched_types': list(candidate_types),
                'is_trackable': bool(candidate_types),
                'is_ready': vault_doc is not None,
                'vault_document_id': vault_doc.id if vault_doc else None,
                'updated_at': vault_doc.updated_at if vault_doc else None,
            })

        # Mandatory first, then vault-trackable items, then manual checklist rows.
        documents.sort(key=lambda d: (not d['is_mandatory'], not d['is_trackable']))

        trackable = [d for d in documents if d['is_trackable']]
        mandatory_trackable = [d for d in trackable if d['is_mandatory']]
        optional_trackable = [d for d in trackable if not d['is_mandatory']]

        mandatory_ready = sum(1 for d in mandatory_trackable if d['is_ready'])
        optional_ready = sum(1 for d in optional_trackable if d['is_ready'])
        manual_count = len(documents) - len(trackable)

        return Response({
            'scheme_id': scheme.scheme_id,
            'has_required_documents': len(documents) > 0,
            'documents': documents,
            # Readiness score is computed over vault-trackable rows only.
            'ready_count': mandatory_ready + optional_ready,
            'total_count': len(trackable),
            'mandatory_ready': mandatory_ready,
            'mandatory_total': len(mandatory_trackable),
            'optional_ready': optional_ready,
            'optional_total': len(optional_trackable),
            # Checklist rows with no vault equivalent (scheme-specific proofs).
            'manual_count': manual_count,
            'other_requirements_count': manual_count,
            'is_application_ready': len(mandatory_trackable) > 0 and mandatory_ready == len(mandatory_trackable),
        })
