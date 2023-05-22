from celery.result import AsyncResult
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, JsonResponse
from django.views.decorators.http import require_http_methods

from img_generation import tasks
from personal_account.forms import GenerateImageRequestForm


@login_required
@require_http_methods(["POST"])
def run_processing_task(request):
    """
    Запускает фоновую задачу - запрос генерации картины.
    Возвращает id задачи (task_id).
    """

    form = GenerateImageRequestForm(request.POST)

    if form.is_valid():
        task: AsyncResult = tasks.initiate_processing.delay(
            prompt=form.cleaned_data["prompt"],
            neg_prompt=form.cleaned_data["neg_prompt"],
        )
        return JsonResponse({"task_id": task.id}, status=202)

    return HttpResponseBadRequest("Некорректные данные запроса")


@login_required
@require_http_methods(["GET"])
def run_check_status_task(request):
    """
    Запускает фоновую задачу - получение статуса заявки на генерацию.
    Возвращает id задачи (task_id).
    """

    order_id = request.GET.get("order_id")

    if not order_id:
        return HttpResponseBadRequest("Необходимо передать order_id")

    task: AsyncResult = tasks.check_status.delay(order_id=order_id)

    return JsonResponse({"task_id": task.id}, status=202)


@login_required
@require_http_methods(["GET"])
def run_get_results_task(request):
    """
    Запускает фоновую задачу - получение результата заявки на генерацию.
    Возвращает id задачи (task_id).
    """

    order_id = request.GET.get("order_id")

    if not order_id:
        return HttpResponseBadRequest("Необходимо передать order_id")

    task: AsyncResult = tasks.get_results.delay(order_id=order_id)

    return JsonResponse({"task_id": task.id}, status=202)


@login_required
@require_http_methods(["GET"])
def get_task_status(request, task_id: str):
    """Возвращает словарь со статусом выполнения фоновой задачи"""

    task_result = AsyncResult(task_id)
    data = {
        "task_id": task_id,
        "task_status": task_result.status,
        "task_result": task_result.result,
    }
    return JsonResponse(data, status=200)
