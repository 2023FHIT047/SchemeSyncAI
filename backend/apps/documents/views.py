from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import RequiredDocument
from apps.schemes.serializers import RequiredDocumentSerializer
from ai.ocr_service import OCRService


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

        if result['success']:
            return Response(result, status=200)
        else:
            return Response(result, status=422)
