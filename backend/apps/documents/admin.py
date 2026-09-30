from django.contrib import admin
from .models import RequiredDocument

@admin.register(RequiredDocument)
class RequiredDocumentAdmin(admin.ModelAdmin):
    list_display = ('scheme', 'document_name', 'is_mandatory')
    list_filter = ('is_mandatory',)
    search_fields = ('scheme__scheme_name', 'document_name', 'description')
