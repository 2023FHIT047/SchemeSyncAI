from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
        ('TRANSGENDER', 'Transgender'),
    ]

    OCCUPATION_CHOICES = [
        ('FARMER', 'Farmer'),
        ('STUDENT', 'Student'),
        ('SELF_EMPLOYED', 'Self-Employed'),
        ('UNEMPLOYED', 'Unemployed'),
        ('PRIVATE_JOB', 'Private Job'),
        ('GOVT_JOB', 'Government Job'),
        ('LABOURER', 'Daily Wage Labourer'),
        ('BUSINESS', 'Small Business / Artisan'),
        ('HOMEMAKER', 'Homemaker'),
        ('OTHER', 'Other'),
    ]

    EDUCATION_CHOICES = [
        ('BELOW_10TH', 'Below 10th Standard'),
        ('10TH_PASS', '10th Pass (SSLC)'),
        ('12TH_PASS', '12th Pass (HSC/Intermediate)'),
        ('DIPLOMA', 'Diploma / ITI'),
        ('GRADUATE', 'Graduate (Bachelor\'s Degree)'),
        ('POST_GRADUATE', 'Post Graduate (Master\'s Degree)'),
        ('DOCTORATE', 'Ph.D. / Doctorate'),
        ('OTHER', 'Other'),
    ]

    CASTE_CHOICES = [
        ('GENERAL', 'General'),
        ('OBC', 'Other Backward Class (OBC)'),
        ('SC', 'Scheduled Caste (SC)'),
        ('ST', 'Scheduled Tribe (ST)'),
        ('EWS', 'Economically Weaker Section (EWS)'),
        ('OTHER', 'Other'),
    ]

    MARITAL_CHOICES = [
        ('SINGLE', 'Single / Unmarried'),
        ('MARRIED', 'Married'),
        ('WIDOW', 'Widow / Widower'),
        ('DIVORCED', 'Divorced / Separated'),
    ]

    EMPLOYMENT_CHOICES = [
        ('EMPLOYED', 'Employed'),
        ('UNEMPLOYED', 'Unemployed'),
        ('SELF_EMPLOYED', 'Self-Employed'),
        ('STUDENT', 'Student'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default='')
    
    state = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    
    annual_family_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    occupation = models.CharField(max_length=50, choices=OCCUPATION_CHOICES, blank=True, default='')
    education_level = models.CharField(max_length=50, choices=EDUCATION_CHOICES, blank=True, default='')
    
    is_student = models.BooleanField(default=False)
    is_farmer = models.BooleanField(default=False)
    land_ownership = models.BooleanField(default=False)
    land_holding_acres = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    caste_category = models.CharField(max_length=20, choices=CASTE_CHOICES, blank=True, default='')
    is_disabled = models.BooleanField(default=False)
    disability_percentage = models.PositiveIntegerField(null=True, blank=True)
    
    marital_status = models.CharField(max_length=20, choices=MARITAL_CHOICES, blank=True, default='')
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES, blank=True, default='')
    bpl_card_holder = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username} ({self.full_name or 'No Name'})"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
