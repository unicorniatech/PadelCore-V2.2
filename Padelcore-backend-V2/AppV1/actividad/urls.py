from rest_framework.routers import DefaultRouter
from .views import ActividadRecienteViewSet

router = DefaultRouter()
router.register(r'actividades', ActividadRecienteViewSet, basename='actividad')

urlpatterns = router.urls
