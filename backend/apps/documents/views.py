from rest_framework import generics, permissions
from .models import RequiredDocument
from apps.schemes.serializers import RequiredDocumentSerializer

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
