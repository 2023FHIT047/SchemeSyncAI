from django.contrib import admin
from .models import GovernmentScheme, SavedScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

class EligibilityRuleInline(admin.TabularInline):
    model = EligibilityRule
    extra = 1

class RequiredDocumentInline(admin.TabularInline):
    model = RequiredDocument
    extra = 1

@admin.register(GovernmentScheme)
class GovernmentSchemeAdmin(admin.ModelAdmin):
    list_display = ('scheme_id', 'scheme_name', 'category', 'ministry', 'scheme_type', 'applicable_state', 'scheme_status', 'is_demo_data')
    list_filter = ('category', 'scheme_type', 'scheme_status', 'applicable_state', 'is_demo_data')
    search_fields = ('scheme_id', 'scheme_name', 'ministry', 'short_description', 'benefits')
    inlines = [EligibilityRuleInline, RequiredDocumentInline]
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SavedScheme)
class SavedSchemeAdmin(admin.ModelAdmin):
    list_display = ('user', 'scheme', 'saved_at')
    search_fields = ('user__username', 'scheme__scheme_name')
