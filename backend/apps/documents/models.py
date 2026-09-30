from django.db import models
from apps.schemes.models import GovernmentScheme

class RequiredDocument(models.Model):
    scheme = models.ForeignKey(GovernmentScheme, on_delete=models.CASCADE, related_name='required_documents')
    document_name = models.CharField(max_length=255, help_text="e.g. Aadhaar Card, Income Certificate, Bank Passbook")
    is_mandatory = models.BooleanField(default=True, help_text="Mandatory or optional document")
    description = models.TextField(blank=True, default='', help_text="Guidance on where or how to procure this document")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_name} ({'Mandatory' if self.is_mandatory else 'Optional'}) for {self.scheme.scheme_id}"
