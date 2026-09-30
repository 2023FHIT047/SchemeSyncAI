from django.db import models
from apps.schemes.models import GovernmentScheme

class EligibilityRule(models.Model):
    OPERATOR_CHOICES = [
        ('=', 'Equals'),
        ('!=', 'Not Equals'),
        ('>', 'Greater Than'),
        ('<', 'Less Than'),
        ('>=', 'Greater Than or Equal To'),
        ('<=', 'Less Than or Equal To'),
        ('IN', 'In List (Comma-separated)'),
        ('NOT IN', 'Not In List'),
    ]

    VALUE_TYPE_CHOICES = [
        ('STRING', 'String / Text'),
        ('NUMBER', 'Number / Currency'),
        ('BOOLEAN', 'Boolean (True/False)'),
        ('LIST', 'List of Options'),
    ]

    scheme = models.ForeignKey(GovernmentScheme, on_delete=models.CASCADE, related_name='eligibility_rules')
    attribute = models.CharField(
        max_length=100,
        help_text="Target attribute e.g. age, annual_family_income, state, occupation, is_farmer, is_student, land_ownership, caste_category, is_disabled, bpl_card_holder"
    )
    operator = models.CharField(max_length=10, choices=OPERATOR_CHOICES, default='=')
    value = models.CharField(max_length=500, help_text="Target rule value e.g. 18, 500000, Maharashtra, Karnataka, True, FEMALE")
    value_type = models.CharField(max_length=20, choices=VALUE_TYPE_CHOICES, default='STRING')
    description = models.CharField(max_length=255, help_text="Human-readable rule explanation e.g. Annual family income must be under ₹5,00,000")
    is_mandatory = models.BooleanField(default=True, help_text="Whether rule failure invalidates scheme eligibility completely")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rule for {self.scheme.scheme_id}: {self.attribute} {self.operator} {self.value}"
