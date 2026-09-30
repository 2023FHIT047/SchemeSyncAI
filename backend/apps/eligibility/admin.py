from django.contrib import admin
from .models import EligibilityRule

@admin.register(EligibilityRule)
class EligibilityRuleAdmin(admin.ModelAdmin):
    list_display = ('scheme', 'attribute', 'operator', 'value', 'value_type', 'is_mandatory')
    list_filter = ('attribute', 'operator', 'value_type', 'is_mandatory')
    search_fields = ('scheme__scheme_name', 'attribute', 'value', 'description')
