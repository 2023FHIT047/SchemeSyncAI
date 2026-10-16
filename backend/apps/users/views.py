from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Count
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer, ChangePasswordSerializer
from apps.eligibility.models import EligibilityRule


# Fields that count toward the profile completion percentage.
# (field, label, profile-page section)
COMPLETION_VALUE_FIELDS = [
    ('full_name', 'Full Name', 'personal'),
    ('date_of_birth', 'Date of Birth / Age', 'personal'),
    ('gender', 'Gender', 'personal'),
    ('state', 'State', 'location'),
    ('district', 'District', 'location'),
    ('annual_family_income', 'Annual Family Income', 'income'),
    ('occupation', 'Occupation', 'income'),
    ('education_level', 'Education Level', 'income'),
    ('caste_category', 'Caste Category', 'social'),
    ('marital_status', 'Marital Status', 'family'),
    ('employment_status', 'Employment Status', 'family'),
]

# Which eligibility-rule attributes a profile field feeds (for impact counts).
FIELD_RULE_ATTRIBUTES = {
    'date_of_birth': ['age'],
    'gender': ['gender'],
    'state': ['resident_state', 'state'],
    'annual_family_income': ['annual_family_income'],
    'occupation': ['occupation'],
    'caste_category': ['caste_category'],
}

# Boolean statuses surfaced as optional declarations (do not affect the %).
# (field, label, rule attributes, profile-page section)
COMPLETION_DECLARATIONS = [
    ('is_student', 'Currently a Student', ['is_student'], 'farm'),
    ('is_farmer', 'Farmer', ['is_farmer'], 'farm'),
    ('land_ownership', 'Owns Agricultural Land', ['land_ownership'], 'farm'),
    ('is_disabled', 'Person with Disability', [], 'social'),
    ('bpl_card_holder', 'BPL Card Holder', [], 'family'),
]


def _is_filled(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return True


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class UserMeView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"status": "password set"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileCompletionView(APIView):
    """GET /api/users/profile/completion/ — profile completeness with eligibility impact."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        attribute_counts = {
            row['attribute']: row['n']
            for row in EligibilityRule.objects
            .exclude(attribute='eligibility_text')
            .values('attribute')
            .annotate(n=Count('scheme', distinct=True))
        }

        def affects(attributes):
            return sum(attribute_counts.get(attr, 0) for attr in attributes)

        completed = 0
        missing_fields = []
        for field, label, section in COMPLETION_VALUE_FIELDS:
            if field == 'date_of_birth':
                filled = bool(profile.date_of_birth or profile.age)
            else:
                filled = _is_filled(getattr(profile, field))
            if filled:
                completed += 1
            else:
                missing_fields.append({
                    'field': field,
                    'label': label,
                    'section': section,
                    'affects_schemes': affects(FIELD_RULE_ATTRIBUTES.get(field, [])),
                })

        missing_fields.sort(key=lambda item: -item['affects_schemes'])

        declarations = sorted(
            (
                {
                    'field': field,
                    'label': label,
                    'confirmed': bool(getattr(profile, field)),
                    'section': section,
                    'affects_schemes': affects(attributes),
                }
                for field, label, attributes, section in COMPLETION_DECLARATIONS
            ),
            key=lambda item: -item['affects_schemes'],
        )

        total = len(COMPLETION_VALUE_FIELDS)
        return Response({
            'percent': round(completed / total * 100),
            'completed_count': completed,
            'total_count': total,
            'missing_fields': missing_fields,
            'declarations': declarations,
            'is_complete': completed == total,
        })
