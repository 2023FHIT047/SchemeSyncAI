from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.schemes.models import GovernmentScheme
from apps.users.models import UserProfile
from ai.recommendation_service import RecommendationService
from apps.schemes.serializers import GovernmentSchemeSerializer

class PersonalizedRecommendationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        schemes = GovernmentScheme.objects.filter(scheme_status='ACTIVE')
        
        recs = RecommendationService.get_recommendations(profile, schemes, limit=6)

        results = []
        for r in recs:
            s_data = GovernmentSchemeSerializer(r['scheme'], context={'request': request}).data
            results.append({
                'scheme': s_data,
                'relevance_score': r['relevance_score'],
                'is_eligible': r['is_eligible'],
                'eligibility_summary': r['eligibility_summary'],
                'matched_conditions': r['matched_conditions'],
                'failed_conditions': r['failed_conditions']
            })

        return Response({
            'count': len(results),
            'recommendations': results
        }, status=status.HTTP_200_OK)
