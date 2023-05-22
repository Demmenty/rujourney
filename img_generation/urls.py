from django.urls import path

from img_generation import views

urlpatterns = [
    path(
        "run_task/processing",
        views.run_processing_task,
        name="run_processing_task",
    ),
    path(
        "run_task/check_status",
        views.run_check_status_task,
        name="run_check_status_task",
    ),
    path(
        "run_task/get_results",
        views.run_get_results_task,
        name="run_get_results_task",
    ),
    path(
        "get_status/<task_id>", views.get_task_status, name="get_task_status"
    ),
]
