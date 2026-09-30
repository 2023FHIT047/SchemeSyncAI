from django.urls import path
from .views import EvaluateSchemeView, EvaluateAllSchemesView

urlpatterns = [
    path('evaluate-all/', EvaluateAllSchemesView.as_view(), name='evaluate_all_schemes'),
    path('evaluate/<str:scheme_id>/', EvaluateSchemeView.as_view(), name='evaluate_scheme'),
]
