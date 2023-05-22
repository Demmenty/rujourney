import os

from celery import Celery

# установить значение по умолчанию для среды DJANGO_SETTINGS_MODULE,
# чтобы Celery знала, как найти проект Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rujourney.settings")

# создание экземпляра Celery с именем rujourney (в переменной app)
app = Celery("rujourney")

# Затем мы загрузили значения конфигурации Celery из объекта настроек из django.conf.
#  Мы использовали namespace=«CELERY» для предотвращения коллизий с другими настройками Django.
# Таким образом, все настройки конфигурации для Celery должны начинаться с префикса CELERY_.
app.config_from_object("django.conf:settings", namespace="CELERY")

# app.autodiscover_tasks() говорит Celery искать задания из приложений,
# определенных в settings.INSTALLED_APPS.
app.autodiscover_tasks()
