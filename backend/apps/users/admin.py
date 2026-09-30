from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'state', 'occupation', 'annual_family_income', 'is_farmer', 'is_student')
    search_fields = ('user__username', 'full_name', 'state', 'district', 'occupation')
    list_filter = ('gender', 'state', 'occupation', 'caste_category', 'is_farmer', 'is_student', 'is_disabled')
