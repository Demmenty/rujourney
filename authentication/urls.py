from django.urls import path

from authentication import ajax, views

urlpatterns = [
    path("registration/", ajax.registration_view, name="registration"),
    path("login/", ajax.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
]
