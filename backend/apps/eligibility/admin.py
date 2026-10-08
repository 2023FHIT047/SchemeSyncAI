from django.contrib import admin
from .models import EligibilityRule, EligibilityCertificate

@admin.register(EligibilityRule)
class EligibilityRuleAdmin(admin.ModelAdmin):
    list_display = ('scheme', 'attribute', 'operator', 'value', 'value_type', 'is_mandatory')
    list_filter = ('attribute', 'operator', 'value_type', 'is_mandatory')
    search_fields = ('scheme__scheme_name', 'attribute', 'value', 'description')


@admin.register(EligibilityCertificate)
class EligibilityCertificateAdmin(admin.ModelAdmin):
    list_display = ('verification_id', 'user', 'scheme', 'eligibility_score', 'issued_at')
    search_fields = ('verification_id', 'user__username', 'scheme__scheme_name')
    readonly_fields = ('verification_id', 'issued_at')
