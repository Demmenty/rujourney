from django.shortcuts import render

from authentication.forms import LoginForm, RegisterForm


def homepage(request):
    """Главная страница сайта"""

    template = "homepage/homepage.html"

    data = {
        "register_form": RegisterForm(),
        "login_form": LoginForm(),
    }

    return render(request, template, data)
