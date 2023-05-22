import json

import requests
from celery import shared_task

from rujourney.settings import IMG_GEN_URL


@shared_task
def initiate_processing(
    prompt: str,
    neg_prompt: str = "",
    ups: int = 4,
    imgs: str | list[str] = None,
    strength: float = 0.0,
    n: int = 1,
    height: int = 512,
    width: int = 512,
    steps: int = 50,
    scale: float = 7.5,
    seed: int = None,
    desc: bool = False,
    cpu: bool = False,
) -> dict:
    """
    Отправляет запрос для создания заявки на генерацию картины.
    Возвращает словарь с номером заявки (order_id) или ошибкой (error).
    """

    params = {
        "prompt": prompt,
        "neg_prompt": neg_prompt,
        "ups": ups,
        "imgs": imgs,
        "strength": strength,
        "n": n,
        "height": height,
        "width": width,
        "steps": steps,
        "scale": scale,
        "seed": seed,
        "desc": desc,
        "cpu": cpu,
    }

    try:
        response = requests.post(
            IMG_GEN_URL + "initiate_processing", json=json.dumps(params)
        )
    except Exception as error:
        return {"error": error}

    if response.ok:
        return {"order_id": response.text}

    return {"error": response.text}


@shared_task
def check_status(order_id: int) -> dict:
    """
    Отправляет запрос статуса заявки.
    Возвращает словарь с номером заявки (order_id) или ошибкой (error).
    Варианты статуса:
    queue position: n — позиция заявки в очереди на обработку;
    processing — заявка в обработке;
    completed — обработка заявки завершена;
    error — ошибка при обработке заявки;
    """

    params = {"id": order_id}

    try:
        response = requests.post(
            IMG_GEN_URL + "check_status", json=json.dumps(params)
        )
    except Exception as error:
        return {"error": error}

    if response.ok:
        return {"order_status": response.text}

    return {"error": response.text}


@shared_task
def get_results(order_id: int) -> dict:
    """
    Отправляет запрос результата заявки.
    Возвращает словарь с результатом (order_result) или ошибкой (error).
    """

    params = {"id": order_id}

    try:
        response = requests.post(
            IMG_GEN_URL + "get_results", json=json.dumps(params)
        )
    except Exception as error:
        return {"error": error}

    if response.ok:
        return {"order_result": response.json()}

    return {"error": response.text}
