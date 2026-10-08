from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from apps.schemes.models import GovernmentScheme
from apps.users.models import UserProfile
from .models import EligibilityCertificate
from .certificate_service import build_certificate_pdf
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


class DownloadCertificateView(APIView):
    """
    POST /api/eligibility/certificate/<str:scheme_id>/download/
    Issues (or returns the existing) eligibility certificate as a downloadable PDF.
    Only granted when the authenticated user is FULLY eligible for the scheme.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, scheme_id):
        try:
            scheme = GovernmentScheme.objects.get(scheme_id=scheme_id)
        except GovernmentScheme.DoesNotExist:
            return Response({'error': 'Scheme not found'}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        analysis = EligibilityEngine.evaluate_scheme(scheme, profile)

        if not analysis['is_eligible']:
            return Response({
                'error': 'Certificate can only be issued when you fully meet the scheme eligibility criteria.',
                'eligibility_score': analysis['eligibility_score'],
            }, status=status.HTTP_403_FORBIDDEN)

        criteria_snapshot = [
            {
                'description': m.get('description'),
                'user_value': str(m.get('user_value')),
                'required_value': m.get('required_value'),
            }
            for m in analysis.get('matched_conditions', [])
        ]

        certificate, created = EligibilityCertificate.objects.get_or_create(
            user=request.user,
            scheme=scheme,
            defaults={
                'eligibility_score': analysis['eligibility_score'],
                'criteria_snapshot': criteria_snapshot,
            },
        )
        if not created:
            certificate.eligibility_score = analysis['eligibility_score']
            certificate.criteria_snapshot = criteria_snapshot
            certificate.save()

        pdf_bytes = build_certificate_pdf(certificate, profile, analysis)
        filename = f'eligibility-certificate-{scheme_id}-{certificate.verification_id}.pdf'

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Verification-Id'] = certificate.verification_id
        return response


class VerifyCertificateView(APIView):
    """
    GET /api/eligibility/certificate/verify/<str:verification_id>/
    Public endpoint to confirm a certificate's authenticity.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request, verification_id):
        try:
            certificate = EligibilityCertificate.objects.select_related(
                'user', 'scheme', 'user__profile'
            ).get(verification_id=verification_id.strip().upper())
        except EligibilityCertificate.DoesNotExist:
            return Response({'valid': False, 'error': 'No certificate found with this verification ID.'},
                            status=status.HTTP_404_NOT_FOUND)

        profile = getattr(certificate.user, 'profile', None)
        holder_name = (profile.full_name if profile and profile.full_name else
                       certificate.user.get_full_name() or certificate.user.username)

        return Response({
            'valid': True,
            'verification_id': certificate.verification_id,
            'holder_name': holder_name,
            'scheme_id': certificate.scheme.scheme_id,
            'scheme_name': certificate.scheme.scheme_name,
            'eligibility_score': certificate.eligibility_score,
            'issued_at': certificate.issued_at.isoformat(),
        }, status=status.HTTP_200_OK)
