from rest_framework.routers import DefaultRouter
from .views import TorneoViewSet

router = DefaultRouter()
router.register(r'torneos', TorneoViewSet, basename='torneo')

urlpatterns = router.urls
