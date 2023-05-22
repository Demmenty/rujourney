FROM python

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# рабочая директория внутри контейнера
WORKDIR /rujourney

EXPOSE 80
EXPOSE 8000
EXPOSE 9000
EXPOSE 9001

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY . .