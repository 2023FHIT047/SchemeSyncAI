from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.schemes.models import GovernmentScheme
from apps.users.models import UserProfile
from .engine import EligibilityEngine
from ai.explanation_service import ExplanationService

class EvaluateSchemeView(APIView):
    """
    Evaluates eligibility for a single scheme against authenticated user profile or payload profile.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request, scheme_id):
        try:
            scheme = GovernmentScheme.objects.get(scheme_id=scheme_id)
        except GovernmentScheme.DoesNotExist:
            return Response({'error': 'Scheme not found'}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve profile from request user or request payload
        user_profile = None
        if request.user.is_authenticated and hasattr(request.user, 'profile'):
            user_profile = request.user.profile
        elif 'profile' in request.data:
            user_profile = request.data['profile']

        if not user_profile:
            return Response({'error': 'No user profile supplied or authenticated'}, status=status.HTTP_400_BAD_REQUEST)

        analysis = EligibilityEngine.evaluate_scheme(scheme, user_profile)
        natural_explanation = ExplanationService.generate_explanation(analysis)
        analysis['natural_explanation'] = natural_explanation

        return Response(analysis, status=status.HTTP_200_OK)

class EvaluateAllSchemesView(APIView):
    """
    Evaluates user eligibility across all active government schemes in the database.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        schemes = GovernmentScheme.objects.filter(scheme_status='ACTIVE')

        eligible_list = []
        ineligible_list = []

        for scheme in schemes:
            analysis = EligibilityEngine.evaluate_scheme(scheme, profile)
            if analysis['is_eligible']:
                eligible_list.append({
                    'scheme_id': scheme.scheme_id,
                    'scheme_name': scheme.scheme_name,
                    'category': scheme.category,
                    'category_display': scheme.get_category_display(),
                    'short_description': scheme.short_description,
                    'benefits': scheme.benefits,
                    'analysis': analysis
                })
            else:
                ineligible_list.append({
                    'scheme_id': scheme.scheme_id,
                    'scheme_name': scheme.scheme_name,
                    'category': scheme.category,
                    'category_display': scheme.get_category_display(),
                    'analysis': analysis
                })

        return Response({
            'total_schemes_checked': schemes.count(),
            'eligible_count': len(eligible_list),
            'eligible_schemes': eligible_list,
            'ineligible_schemes': ineligible_list
        }, status=status.HTTP_200_OK)
