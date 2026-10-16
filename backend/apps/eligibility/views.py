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
        schemes = GovernmentScheme.objects.filter(scheme_status='ACTIVE').prefetch_related('eligibility_rules')

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


class SimulateEligibilityView(APIView):
    """
    POST /api/eligibility/simulate/
    Evaluates all active schemes against a hypothetical profile without saving anything.
    When the caller is authenticated, results are diffed against their real profile's
    eligibility (newly unlocked vs no-longer-eligible schemes).
    """
    permission_classes = (permissions.AllowAny,)

    SIM_KEYS = {
        'age': 'int',
        'annual_family_income': 'float',
        'state': 'str',
        'gender': 'str',
        'caste_category': 'str',
        'occupation': 'str',
        'education_level': 'str',
        'marital_status': 'str',
        'is_student': 'bool',
        'is_farmer': 'bool',
        'land_ownership': 'bool',
        'is_disabled': 'bool',
        'bpl_card_holder': 'bool',
    }

    @classmethod
    def _sanitize_profile(cls, raw):
        clean = {}
        for key, kind in cls.SIM_KEYS.items():
            if key not in raw:
                continue
            val = raw[key]
            if val is None or val == '':
                continue
            try:
                if kind == 'bool':
                    if isinstance(val, str):
                        val = val.strip().lower() in ('true', '1', 'yes')
                    else:
                        val = bool(val)
                elif kind == 'int':
                    val = max(0, min(120, int(float(val)))) if key == 'age' else int(float(val))
                elif kind == 'float':
                    val = max(0.0, float(val))
                else:
                    val = str(val).strip()[:100]
            except (TypeError, ValueError):
                continue
            if val == '':
                continue
            clean[key] = val
        return clean

    @staticmethod
    def _compact(scheme, analysis):
        return {
            'scheme_id': scheme.scheme_id,
            'scheme_name': scheme.scheme_name,
            'category': scheme.category,
            'category_display': scheme.get_category_display(),
            'short_description': (scheme.short_description or '')[:240],
            'matched': [m.get('description', '') for m in analysis['matched_conditions'][:3]],
        }

    def post(self, request):
        raw = request.data.get('profile')
        if not isinstance(raw, dict):
            return Response({'error': 'Provide a "profile" object with hypothetical attributes.'},
                            status=status.HTTP_400_BAD_REQUEST)

        sim_profile = self._sanitize_profile(raw)
        if not sim_profile:
            return Response({'error': 'No valid profile attributes supplied.'},
                            status=status.HTTP_400_BAD_REQUEST)

        schemes = list(
            GovernmentScheme.objects.filter(scheme_status='ACTIVE').prefetch_related('eligibility_rules')
        )

        def evaluate_all(profile):
            compacts = {}
            for scheme in schemes:
                analysis = EligibilityEngine.evaluate_scheme(scheme, profile)
                if analysis['is_eligible']:
                    compacts[scheme.scheme_id] = self._compact(scheme, analysis)
            return compacts

        sim_compacts = evaluate_all(sim_profile)

        real_compacts = None
        if request.user.is_authenticated:
            real_profile, _ = UserProfile.objects.get_or_create(user=request.user)
            real_compacts = evaluate_all(real_profile)

        payload = {
            'total_schemes_checked': len(schemes),
            'simulated_eligible_count': len(sim_compacts),
            'is_authenticated': request.user.is_authenticated,
            'real_eligible_count': len(real_compacts) if real_compacts is not None else None,
        }

        if real_compacts is not None:
            newly_ids = [sid for sid in sim_compacts if sid not in real_compacts]
            lost_ids = [sid for sid in real_compacts if sid not in sim_compacts]
            payload['newly_eligible'] = [sim_compacts[sid] for sid in newly_ids[:100]]
            payload['newly_eligible_truncated'] = len(newly_ids) > 100
            payload['no_longer_eligible'] = [real_compacts[sid] for sid in lost_ids[:100]]
            payload['no_longer_eligible_truncated'] = len(lost_ids) > 100

        eligible_list = list(sim_compacts.values())
        payload['eligible_schemes'] = eligible_list[:300]
        payload['eligible_truncated'] = len(eligible_list) > 300

        return Response(payload, status=status.HTTP_200_OK)


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
