from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from apps.schemes.models import GovernmentScheme
from ai.chatbot_service import ChatbotService

class ChatbotQueryView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Please provide a non-empty user query'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve relevant schemes based on keyword matching
        words = query.split()
        q_filter = Q()
        for w in words:
            if len(w) > 2:
                q_filter |= Q(scheme_name__icontains=w) | Q(short_description__icontains=w) | Q(category__icontains=w) | Q(benefits__icontains=w)

        relevant_schemes = list(GovernmentScheme.objects.filter(q_filter)[:5])
        if not relevant_schemes:
            relevant_schemes = list(GovernmentScheme.objects.filter(scheme_status='ACTIVE')[:5])

        user_summary = ""
        if request.user.is_authenticated and hasattr(request.user, 'profile'):
            p = request.user.profile
            user_summary = f"Age: {p.age}, State: {p.state}, Occupation: {p.occupation}, Farmer: {p.is_farmer}, Student: {p.is_student}"

        service = ChatbotService()
        result = service.generate_response(query, context_schemes=relevant_schemes, user_profile_summary=user_summary)

        return Response({
            'query': query,
            'answer': result['answer'],
            'source': result['source'],
            'is_fallback': result['is_fallback'],
            'referenced_schemes': [
                {'scheme_id': s.scheme_id, 'scheme_name': s.scheme_name, 'category': s.category} for s in relevant_schemes
            ]
        }, status=status.HTTP_200_OK)
