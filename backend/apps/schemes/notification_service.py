import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.contrib.auth.models import User

from apps.users.models import UserProfile
from apps.eligibility.engine import EligibilityEngine
from .models import SchemeNotification

logger = logging.getLogger(__name__)


def notify_eligible_users(scheme):
    """
    Evaluate a newly created scheme against all user profiles.
    Send email notifications to eligible users.
    Returns the count of users notified.
    """
    profiles = UserProfile.objects.select_related('user').all()
    notified_count = 0

    for profile in profiles:
        if not profile.user.email:
            continue
        if profile.user.is_staff:
            continue

        result = EligibilityEngine.evaluate_scheme(scheme, profile)

        if result['is_eligible'] and result['eligibility_score'] >= 50:
            notification, created = SchemeNotification.objects.get_or_create(
                user=profile.user,
                scheme=scheme,
                defaults={'eligibility_score': result['eligibility_score']}
            )

            if created or not notification.email_sent:
                try:
                    _send_notification_email(profile.user, profile, scheme, result)
                    notification.email_sent = True
                    notification.email_sent_at = timezone.now()
                    notification.save()
                    notified_count += 1
                except Exception as e:
                    logger.error(f"Failed to send notification to {profile.user.email}: {e}")

    return notified_count


def _send_notification_email(user, profile, scheme, eligibility_result):
    subject = f"New Scheme Alert: You may be eligible for {scheme.scheme_name}!"

    display_name = profile.full_name or user.first_name or user.username
    scheme_url = f"{settings.FRONTEND_URL}/schemes/{scheme.scheme_id}"

    message = f"""Dear {display_name},

Great news! A new government welfare scheme has been added that matches your profile.

SCHEME: {scheme.scheme_name}
CATEGORY: {scheme.get_category_display()}
MINISTRY: {scheme.ministry}
BENEFIT: {scheme.benefit_amount or scheme.benefits[:100]}
ELIGIBILITY SCORE: {eligibility_result['eligibility_score']}%

ABOUT:
{scheme.short_description}

You have been identified as potentially eligible based on your profile information.

View full details and apply here: {scheme_url}

---
This is an automated notification from GovScheme AI.
You are receiving this because your profile matches the eligibility criteria.
"""

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2d5a87); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">🇮🇳 GovScheme AI</h2>
            <p style="color: #cbd5e1; margin: 5px 0 0;">New Scheme Notification</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Dear <strong>{display_name}</strong>,</p>
            <p>Great news! A new government welfare scheme has been added that matches your profile.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #166534;">{scheme.scheme_name}</h3>
                <p style="margin: 4px 0; color: #374151;"><strong>Category:</strong> {scheme.get_category_display()}</p>
                <p style="margin: 4px 0; color: #374151;"><strong>Ministry:</strong> {scheme.ministry}</p>
                <p style="margin: 4px 0; color: #374151;"><strong>Benefit:</strong> {scheme.benefit_amount or scheme.benefits[:100]}</p>
                <p style="margin: 4px 0; color: #166534; font-weight: bold;">Eligibility Score: {eligibility_result['eligibility_score']}%</p>
            </div>
            <p style="color: #4b5563;">{scheme.short_description}</p>
            <a href="{scheme_url}" style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 12px;">View Scheme Details →</a>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;">
            <p style="font-size: 12px; color: #9ca3af;">This is an automated notification from GovScheme AI. You are receiving this because your profile matches the eligibility criteria.</p>
        </div>
    </div>
    """

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
