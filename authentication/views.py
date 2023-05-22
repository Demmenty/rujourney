from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods


@login_required
@require_http_methods(["POST"])
def logout_view(request):
    """Обработка запроса выхода пользователя"""

    logout(request)
    return redirect("homepage")
