from django.urls import path
from .views import (
    EvaluateSchemeView,
    EvaluateAllSchemesView,
    SimulateEligibilityView,
    DownloadCertificateView,
    VerifyCertificateView,
)

urlpatterns = [
    path('evaluate-all/', EvaluateAllSchemesView.as_view(), name='evaluate_all_schemes'),
    path('simulate/', SimulateEligibilityView.as_view(), name='simulate_eligibility'),
    path('certificate/verify/<str:verification_id>/', VerifyCertificateView.as_view(), name='verify_certificate'),
    path('certificate/<str:scheme_id>/download/', DownloadCertificateView.as_view(), name='download_certificate'),
    path('evaluate/<str:scheme_id>/', EvaluateSchemeView.as_view(), name='evaluate_scheme'),
]
