from django.db import models
from django.conf import settings
from apps.schemes.models import GovernmentScheme


class DocumentType(models.TextChoices):
    AADHAAR = 'AADHAAR', 'Aadhaar Card'
    PAN_CARD = 'PAN_CARD', 'PAN Card'
    INCOME_CERTIFICATE = 'INCOME_CERTIFICATE', 'Income Certificate'
    RATION_CARD = 'RATION_CARD', 'Ration Card'
    LAND_RECORD = 'LAND_RECORD', 'Land Record (7/12)'
    CASTE_CERTIFICATE = 'CASTE_CERTIFICATE', 'Caste Certificate'
    DOMICILE_CERTIFICATE = 'DOMICILE_CERTIFICATE', 'Domicile Certificate'
    BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE', 'Birth Certificate'
    DISABILITY_CERTIFICATE = 'DISABILITY_CERTIFICATE', 'Disability Certificate'
    EDUCATION_MARKSHEET = 'EDUCATION_MARKSHEET', 'Education Marksheet'
    BANK_PASSBOOK = 'BANK_PASSBOOK', 'Bank Passbook'
    GENERAL = 'GENERAL', 'Other Document'


class UserDocument(models.Model):
    """A scanned document stored in the user's personal vault."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=32, choices=DocumentType.choices)
    file = models.FileField(upload_to='vault/%Y/%m/', blank=True, default='')
    file_name = models.CharField(max_length=255, blank=True, default='')
    extracted_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'document_type')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.get_document_type_display()} — {self.user}"


class RequiredDocument(models.Model):
    scheme = models.ForeignKey(GovernmentScheme, on_delete=models.CASCADE, related_name='required_documents')
    document_name = models.CharField(max_length=255, help_text="e.g. Aadhaar Card, Income Certificate, Bank Passbook")
    is_mandatory = models.BooleanField(default=True, help_text="Mandatory or optional document")
    description = models.TextField(blank=True, default='', help_text="Guidance on where or how to procure this document")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_name} ({'Mandatory' if self.is_mandatory else 'Optional'}) for {self.scheme.scheme_id}"
