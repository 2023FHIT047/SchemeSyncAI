from rest_framework import serializers
from .models import GovernmentScheme, SavedScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

class EligibilityRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EligibilityRule
        fields = ('id', 'attribute', 'operator', 'value', 'value_type', 'description', 'is_mandatory')

class RequiredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = ('id', 'document_name', 'is_mandatory', 'description')

class GovernmentSchemeSerializer(serializers.ModelSerializer):
    eligibility_rules = EligibilityRuleSerializer(many=True, read_only=True)
    required_documents = RequiredDocumentSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    scheme_type_display = serializers.CharField(source='get_scheme_type_display', read_only=True)
    benefit_type_display = serializers.CharField(source='get_benefit_type_display', read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = GovernmentScheme
        fields = '__all__'

    def get_is_saved(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return SavedScheme.objects.filter(user=request.user, scheme=obj).exists()
        return False

class SavedSchemeSerializer(serializers.ModelSerializer):
    scheme = GovernmentSchemeSerializer(read_only=True)
    scheme_id = serializers.PrimaryKeyRelatedField(
        queryset=GovernmentScheme.objects.all(), source='scheme', write_only=True
    )

    class Meta:
        model = SavedScheme
        fields = ('id', 'scheme', 'scheme_id', 'saved_at')
