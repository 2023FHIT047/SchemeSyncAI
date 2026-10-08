from django.urls import path
from .views import DocumentListView, DocumentScanView

urlpatterns = [
    path('', DocumentListView.as_view(), name='document_list'),
    path('scan/', DocumentScanView.as_view(), name='document_scan'),
]
