from django.contrib.auth.decorators import login_required
from django.http import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseNotFound,
    JsonResponse,
)
from django.views.decorators.http import require_http_methods

from personal_account.forms import GeneratedImageForm
from personal_account.models import GeneratedImage


@login_required
@require_http_methods(["POST"])
def save_generated_image(request):
    """Сохраняет результат генерации картины пользователя в бд"""

    form = GeneratedImageForm(request.POST, request.FILES)

    if form.is_valid():
        generated_image: GeneratedImage = form.save()

        data = {
            "id": generated_image.id,
            "prompt": generated_image.prompt,
            "neg_prompt": generated_image.neg_prompt,
            "thumbnail_url": generated_image.thumbnail.url,
            "image_url": generated_image.image.url,
        }
        return JsonResponse(data, status=200)

    return HttpResponseBadRequest("Некорректные данные формы")


@login_required
@require_http_methods(["POST"])
def delete_generated_image(request):
    """Удаляет сохраненный результат генерации пользователя из бд"""

    image_id = request.POST.get("image_id")
    if not image_id:
        return HttpResponseBadRequest("Необходимо передать image_id")

    generated_image = GeneratedImage.objects.filter(id=image_id).first()
    if not generated_image:
        return HttpResponseNotFound("Картина с таким id не найдена")
    if generated_image.author != request.user:
        return HttpResponseForbidden("Нет прав на удаление")

    generated_image.delete()

    return HttpResponse("Картина удалена")
