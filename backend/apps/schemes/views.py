from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import GovernmentScheme, SavedScheme
from .serializers import GovernmentSchemeSerializer, SavedSchemeSerializer

class SchemeListView(generics.ListCreateAPIView):
    serializer_class = GovernmentSchemeSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        queryset = GovernmentScheme.objects.all()
        
        # Filtering parameters
        category = self.request.query_params.get('category', None)
        state = self.request.query_params.get('state', None)
        scheme_type = self.request.query_params.get('scheme_type', None)
        benefit_type = self.request.query_params.get('benefit_type', None)
        search_query = self.request.query_params.get('search', None)

        if category:
            queryset = queryset.filter(category__iexact=category)

        if state:
            queryset = queryset.filter(Q(applicable_state__iexact=state) | Q(applicable_state__iexact='All India'))

        if scheme_type:
            queryset = queryset.filter(scheme_type__iexact=scheme_type)

        if benefit_type:
            queryset = queryset.filter(benefit_type__iexact=benefit_type)

        if search_query:
            queryset = queryset.filter(
                Q(scheme_name__icontains=search_query) |
                Q(short_description__icontains=search_query) |
                Q(ministry__icontains=search_query) |
                Q(benefits__icontains=search_query) |
                Q(subcategory__icontains=search_query)
            )

        return queryset

class SchemeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GovernmentScheme.objects.all()
    serializer_class = GovernmentSchemeSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    lookup_field = 'scheme_id'

class SavedSchemeListView(generics.ListCreateAPIView):
    serializer_class = SavedSchemeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SavedScheme.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SavedSchemeDetailView(generics.DestroyAPIView):
    serializer_class = SavedSchemeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SavedScheme.objects.filter(user=self.request.user)

class ToggleSaveSchemeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, scheme_id):
        try:
            scheme = GovernmentScheme.objects.get(scheme_id=scheme_id)
        except GovernmentScheme.DoesNotExist:
            return Response({'error': 'Scheme not found'}, status=status.HTTP_404_NOT_FOUND)

        saved_item = SavedScheme.objects.filter(user=request.user, scheme=scheme).first()
        if saved_item:
            saved_item.delete()
            return Response({'saved': False, 'message': 'Scheme removed from saved list'}, status=status.HTTP_200_OK)
        else:
            SavedScheme.objects.create(user=request.user, scheme=scheme)
            return Response({'saved': True, 'message': 'Scheme saved successfully'}, status=status.HTTP_201_CREATED)

class SchemeCompareView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        scheme_ids = request.query_params.get('ids', '')
        if not scheme_ids:
            return Response({'error': 'Please provide comma-separated scheme_ids parameter (e.g. ?ids=pm-kisan,beti-bachao)'}, status=status.HTTP_400_BAD_REQUEST)
        
        id_list = [sid.strip() for sid in scheme_ids.split(',') if sid.strip()]
        schemes = GovernmentScheme.objects.filter(scheme_id__in=id_list)
        serializer = GovernmentSchemeSerializer(schemes, many=True, context={'request': request})
        return Response({'compared_schemes': serializer.data})
