from django.db import models
from django.contrib.auth.models import User


class GovernmentScheme(models.Model):
    CATEGORY_CHOICES = [
        ('FARMER', 'Farmers & Agriculture'),
        ('EDUCATION', 'Education & Student Welfare'),
        ('WOMEN_CHILD', 'Women & Child Welfare'),
        ('HEALTHCARE', 'Healthcare & Health Insurance'),
        ('EMPLOYMENT', 'Employment & Livelihood'),
        ('HOUSING', 'Housing & Urban Infrastructure'),
        ('SENIOR_CITIZEN', 'Senior Citizens & Pension'),
        ('SKILL_DEV', 'Skill Development & Entrepreneurship'),
        ('OTHER', 'Other Welfare Schemes'),
    ]

    SCHEME_TYPE_CHOICES = [
        ('CENTRAL', 'Central Sector Scheme'),
        ('STATE', 'State Sponsored Scheme'),
        ('JOINT', 'Centrally Sponsored Scheme (Joint)'),
    ]

    BENEFIT_TYPE_CHOICES = [
        ('FINANCIAL', 'Direct Financial Assistance / Cash Transfer'),
        ('SUBSIDY', 'Subsidy / Price Support'),
        ('SCHOLARSHIP', 'Scholarship / Fellowship'),
        ('PENSION', 'Pension / Annuity'),
        ('LOAN', 'Subsidized Loan / Credit Facility'),
        ('IN_KIND', 'In-Kind Assistance / Equipment / Goods'),
        ('CERTIFICATE', 'Certificate / Skill Training'),
        ('OTHER', 'Other Support'),
    ]

    APPLICATION_MODE_CHOICES = [
        ('ONLINE', 'Online Portal'),
        ('OFFLINE', 'Physical Office / CSC Centre'),
        ('HYBRID', 'Online & Offline Available'),
    ]

    SCHEME_STATUS_CHOICES = [
        ('ACTIVE', 'Active / Accepting Applications'),
        ('INACTIVE', 'Inactive / Temporarily Suspended'),
        ('UPCOMING', 'Upcoming Scheme'),
        ('CLOSED', 'Closed'),
    ]

    scheme_id = models.CharField(max_length=100, unique=True, help_text="Unique Scheme ID/Slug e.g. pm-kisan")
    scheme_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=100, blank=True, default='')
    
    ministry = models.CharField(max_length=255, help_text="Ministry or Nodal Department")
    scheme_type = models.CharField(max_length=20, choices=SCHEME_TYPE_CHOICES, default='CENTRAL')
    applicable_state = models.CharField(max_length=100, default='All India', help_text="Specific state or 'All India'")
    
    short_description = models.TextField()
    detailed_description = models.TextField(blank=True, default='')
    objective = models.TextField(blank=True, default='')
    benefits = models.TextField()
    
    benefit_type = models.CharField(max_length=30, choices=BENEFIT_TYPE_CHOICES, default='FINANCIAL')
    benefit_amount = models.CharField(max_length=255, blank=True, default='', help_text="e.g. ₹6,000 / year or 100% Fee Waiver")
    
    application_mode = models.CharField(max_length=20, choices=APPLICATION_MODE_CHOICES, default='ONLINE')
    application_link = models.URLField(max_length=500, help_text="Direct link to official application portal")
    official_website = models.URLField(max_length=500, help_text="Main official government website URL")
    official_guidelines_pdf = models.URLField(max_length=500, blank=True, default='', help_text="Link to official PDF circular")
    
    helpline = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    
    scheme_status = models.CharField(max_length=20, choices=SCHEME_STATUS_CHOICES, default='ACTIVE')
    launch_year = models.PositiveIntegerField(null=True, blank=True)
    is_demo_data = models.BooleanField(default=True, help_text="Flag indicating whether scheme is sample demo data")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.scheme_name} ({self.get_category_display()})"


class SavedScheme(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_schemes')
    scheme = models.ForeignKey(GovernmentScheme, on_delete=models.CASCADE, related_name='saved_by_users')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'scheme')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.scheme.scheme_name}"


class SchemeNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheme_notifications')
    scheme = models.ForeignKey(GovernmentScheme, on_delete=models.CASCADE, related_name='notifications')
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    eligibility_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'scheme')
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification: {self.scheme.scheme_name} -> {self.user.email}"
