import logging
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import GovernmentScheme, SchemeNotification
from .serializers import GovernmentSchemeSerializer
from .notification_service import notify_eligible_users
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

logger = logging.getLogger(__name__)


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class AdminSchemeCreateView(APIView):
    permission_classes = (IsStaffUser,)

    def post(self, request):
        data = request.data
        eligibility_rules = data.pop('eligibility_rules', [])
        required_documents = data.pop('required_documents', [])

        serializer = GovernmentSchemeSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        scheme = serializer.save(is_demo_data=False)

        for rule_data in eligibility_rules:
            EligibilityRule.objects.create(
                scheme=scheme,
                attribute=rule_data.get('attribute', ''),
                operator=rule_data.get('operator', '='),
                value=rule_data.get('value', ''),
                value_type=rule_data.get('value_type', 'STRING'),
                description=rule_data.get('description', ''),
                is_mandatory=rule_data.get('is_mandatory', True),
            )

        for doc_data in required_documents:
            RequiredDocument.objects.create(
                scheme=scheme,
                document_name=doc_data.get('document_name', ''),
                is_mandatory=doc_data.get('is_mandatory', True),
                description=doc_data.get('description', ''),
            )

        notified_count = 0
        try:
            notified_count = notify_eligible_users(scheme)
        except Exception as e:
            logger.error(f"Notification process failed for scheme {scheme.scheme_id}: {e}")

        return Response({
            'scheme': GovernmentSchemeSerializer(scheme, context={'request': request}).data,
            'message': f'Scheme created successfully. {notified_count} eligible user(s) notified via email.',
            'notified_count': notified_count,
        }, status=status.HTTP_201_CREATED)


class AdminSchemeListView(APIView):
    permission_classes = (IsStaffUser,)

    def get(self, request):
        schemes = GovernmentScheme.objects.all().order_by('-created_at')
        serializer = GovernmentSchemeSerializer(schemes, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': schemes.count()})


class AdminNotificationListView(APIView):
    permission_classes = (IsStaffUser,)

    def get(self, request):
        notifications = SchemeNotification.objects.select_related('user', 'scheme').order_by('-created_at')[:100]
        data = [{
            'id': n.id,
            'user_email': n.user.email,
            'user_name': n.user.profile.full_name if hasattr(n.user, 'profile') else n.user.username,
            'scheme_name': n.scheme.scheme_name,
            'scheme_id': n.scheme.scheme_id,
            'eligibility_score': n.eligibility_score,
            'email_sent': n.email_sent,
            'email_sent_at': n.email_sent_at,
            'created_at': n.created_at,
        } for n in notifications]
        return Response({'results': data, 'count': len(data)})
