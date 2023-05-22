from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User

REGISTER_FIELDS = (
    "username",
    "email",
    "password1",
    "password2",
)
AUTH_FIELDS = (
    "username",
    "password",
)


class RegisterForm(UserCreationForm):
    """Форма регистрации нового пользователя"""

    def __init__(self, *args, **kwargs):
        super(RegisterForm, self).__init__(*args, **kwargs)

        for fieldname in REGISTER_FIELDS:
            self.fields[fieldname].help_text = None
            self.fields[fieldname].widget.attrs["class"] = "form-control"
            self.fields[fieldname].widget.attrs["required"] = True

    class Meta:
        model = User
        fields = REGISTER_FIELDS


class LoginForm(AuthenticationForm):
    """Форма входа пользователя"""

    def __init__(self, *args, **kwargs):
        super(LoginForm, self).__init__(*args, **kwargs)

        for fieldname in AUTH_FIELDS:
            self.fields[fieldname].widget.attrs["class"] = "form-control"

    class Meta:
        model = User
        fields = AUTH_FIELDS
