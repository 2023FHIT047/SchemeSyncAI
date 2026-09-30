from django.urls import path
from .views import (
    SchemeListView,
    SchemeDetailView,
    SavedSchemeListView,
    SavedSchemeDetailView,
    ToggleSaveSchemeView,
    SchemeCompareView
)

urlpatterns = [
    path('', SchemeListView.as_view(), name='scheme_list'),
    path('saved/', SavedSchemeListView.as_view(), name='saved_schemes_list'),
    path('saved/<int:pk>/', SavedSchemeDetailView.as_view(), name='saved_scheme_detail'),
    path('compare/', SchemeCompareView.as_view(), name='scheme_compare'),
    path('<str:scheme_id>/', SchemeDetailView.as_view(), name='scheme_detail'),
    path('<str:scheme_id>/save/', ToggleSaveSchemeView.as_view(), name='toggle_save_scheme'),
]
