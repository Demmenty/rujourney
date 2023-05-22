from django.forms import (
    CharField,
    Form,
    HiddenInput,
    IntegerField,
    ModelForm,
    Textarea,
)

from personal_account.models import GeneratedImage


class GenerateImageRequestForm(Form):
    """Форма для запроса генерации изображения"""

    author = IntegerField(required=True, min_value=1, widget=HiddenInput())
    prompt = CharField(
        label="Описание изображения",
        required=True,
        widget=Textarea(attrs={"class": "form-control", "rows": "5"}),
    )
    neg_prompt = CharField(
        label="Нежелательные характеристики",
        required=False,
        widget=Textarea(attrs={"class": "form-control", "rows": "5"}),
    )


class GeneratedImageForm(ModelForm):
    """Форма для сохранения результата генерации"""

    class Meta:
        model = GeneratedImage
        fields = (
            "author",
            "prompt",
            "neg_prompt",
            "image",
        )
