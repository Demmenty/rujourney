import io
from os.path import splitext

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db import models
from PIL import Image


class GeneratedImage(models.Model):
    """Модель для хранения результата генерации"""

    author = models.ForeignKey(User, on_delete=models.CASCADE)
    prompt = models.TextField("Описание изображения")
    neg_prompt = models.TextField(
        "Нежелательные характеристики", null=True, blank=True
    )
    image = models.ImageField("Изображение")
    thumbnail = models.ImageField("Превью", null=True, blank=True)
    uploaded_at = models.DateTimeField("Дата создания", auto_now_add=True)

    def __str__(self):
        return f"Картина пользователя {self.author} от {self.uploaded_at}"

    def save(self, *args, **kwargs):
        self.make_thumbnail()
        super(GeneratedImage, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        self.image.delete(save=False)
        self.thumbnail.delete(save=False)
        super(GeneratedImage, self).delete(*args, **kwargs)

    def make_thumbnail(self):
        image = Image.open(self.image)
        image.thumbnail((150, 150), Image.ANTIALIAS)
        thumb_name, thumb_extension = splitext(self.image.name)
        thumb_filename = thumb_name + "_thumb" + thumb_extension
        temp_thumb = io.BytesIO()
        image.save(temp_thumb, "png")
        temp_thumb.seek(0)
        self.thumbnail.save(
            thumb_filename, ContentFile(temp_thumb.read()), save=False
        )
        temp_thumb.close()

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = "Сгенерированная картина"
        verbose_name_plural = "Сгенерированные картины"
