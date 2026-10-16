from django.contrib import admin
from .models import RequiredDocument, UserDocument

@admin.register(RequiredDocument)
class RequiredDocumentAdmin(admin.ModelAdmin):
    list_display = ('scheme', 'document_name', 'is_mandatory')
    list_filter = ('is_mandatory',)
    search_fields = ('scheme__scheme_name', 'document_name', 'description')


@admin.register(UserDocument)
class UserDocumentAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'file_name', 'updated_at')
    list_filter = ('document_type',)
    search_fields = ('user__username', 'file_name')
