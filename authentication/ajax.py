from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.views.decorators.http import require_http_methods

from authentication.forms import RegisterForm


@require_http_methods(["POST"])
def registration_view(request):
    """Обработка запроса регистрации пользователя"""

    form = RegisterForm(request.POST)

    if form.is_valid():
        user = User.objects.create_user(
            username=request.POST["username"],
            password=request.POST["password1"],
            email=request.POST["email"],
        )
        user.save()
        login(request, user)
        return HttpResponse(f"Добро пожаловать, {user.username}!")
    else:
        return JsonResponse(form.errors, status=400)


@require_http_methods(["POST"])
def login_view(request):
    """Обработка запроса входа пользователя"""

    user = authenticate(
        request,
        username=request.POST["username"],
        password=request.POST["password"],
    )
    if user is None:
        return HttpResponseForbidden("Пароль или логин введены неверно")

    login(request, user)
    return HttpResponse(f"С возвращением, {user.username}!")
