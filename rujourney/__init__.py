from .celery import app as celery_app

# автоимпорт приложения Celery при запуске Django
__all__ = ("celery_app",)
