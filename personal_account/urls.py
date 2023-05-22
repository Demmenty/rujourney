from django.urls import path

from personal_account import ajax, views

urlpatterns = [
    path("", views.personal_account, name="personal_account"),
    path(
        "ajax/save_generated_image",
        ajax.save_generated_image,
        name="save_generated_image",
    ),
    path(
        "ajax/delete_generated_image",
        ajax.delete_generated_image,
        name="delete_generated_image",
    ),
]
