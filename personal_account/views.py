from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from personal_account.forms import GenerateImageRequestForm
from personal_account.models import GeneratedImage


@login_required
@require_http_methods(["GET"])
def personal_account(request):
    """Личный кабинет пользователя"""

    template = "personal_account/personal_account.html"

    collection = GeneratedImage.objects.filter(author=request.user)

    data = {
        "user": request.user,
        "new_prompt_form": GenerateImageRequestForm(
            initial={"author": request.user.id}
        ),
        "collection": collection,
    }
    return render(request, template, data)
