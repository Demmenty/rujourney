from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("", include("homepage.urls")),
    path("admin/", admin.site.urls),
    path("authentication/", include("authentication.urls")),
    path("personal_account/", include("personal_account.urls")),
    path("img_generation/", include("img_generation.urls")),
]
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
