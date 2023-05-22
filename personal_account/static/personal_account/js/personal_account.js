$(document).ready(function () {
    $("#new_prompt_form").on("submit", startNewGeneration);
    $("#repeat-prompt-btn").on("click", startNewGeneration);
    $("#reset-prompt-btn").on("click", resetPromptSection);
    $("#save-prompt-result-btn").on("click", saveImageToCollection);
    $(".repeat-saved-prompt-btn").on("click", repeatPromptFromCollection);
    $(".delete-saved-image-btn").on("click", deleteImageFromCollection);
})

const csrf_token = $("#new_prompt_form input[name='csrfmiddlewaretoken']").val();

// АЯКС ЗАПРОСЫ
function sendNewPromptRequest() {
    return $.ajax({
        data: $("#new_prompt_form").serialize(),
        type: "POST",
        url: "/img_generation/run_task/processing",
    });
}

function checkStatusRequest(orderID) {
    return $.ajax({
        data: {"order_id": orderID},
        type: "GET",
        url: `/img_generation/run_task/check_status`,
    })
}

function getResultsRequest(orderID) {
    return $.ajax({
        data: {"order_id": orderID},
        type: "GET",
        url: "/img_generation/run_task/get_results",
    })
}

function getTaskStatusRequest(taskID) {
    return $.ajax({
        type: "GET",
        url: `/img_generation/get_status/${taskID}`,
    })
}

function saveImageRequest() {
    let formData = new FormData(document.getElementById("new_prompt_form"));
    let imgFile = DataURIToBlob($("#result_image img").attr("src"));
    formData.append("image", imgFile, 'image.png');

    return $.ajax({
        data: formData,
        type: "POST",
        url: "/personal_account/ajax/delete_generated_image",
        cache: false,
        contentType: false,
        processData: false,
    })  
}

function deleteImageRequest(imageID) {
    return $.ajax({
        data: {"image_id": imageID, "csrfmiddlewaretoken": csrf_token},
        type: "POST",
        url: "/personal_account/ajax/delete_generated_image",
    }) 
}

// ЗАПУСК ГЕНЕРАЦИИ
function startNewGeneration() {
    // запускает генерацию новой картины
    console.log("startNewGeneration");

    $("#prompt_section").addClass("hidden");
    $("#result_section").addClass("hidden");
    $("#loader_section").removeClass("hidden");

    runTask_Processing();
    return false;
}

function repeatPromptFromCollection() {
    // запускает генерацию новой картины на основе сохраненной
    console.log("repeatPromptFromCollection");

    let modal = $(this).closest(".generated-image-modal");
    let prompt = modal.find(".prompt").text();
    let neg_prompt = modal.find(".neg_prompt").text();

    $("#id_prompt").val(prompt);
    $("#id_neg_prompt").val(neg_prompt);

    modal.find(".btn-close").trigger("click");
    $("#prompt_section").addClass("hidden");
    $("#result_section").addClass("hidden");
    $("#loader_section").removeClass("hidden");

    runTask_Processing();
}


// ПРОЦЕСС ГЕНЕРАЦИИ
function runTask_Processing() {
    // отправляет запрос старта задачи: генерация картины
    console.log("runTask_Processing");

    let request = sendNewPromptRequest();

    request.done(function(response) {
        $("#generation_status").text("Заявка на генерацию отправлена...");
        setTimeout(function() {
            getTaskResult_Processing(response.task_id);
            $("#generation_status").text("Проверка статуса заявки...");
        }, 3000);
    });

    request.fail(function(response) {
        if (response.status == "0") {
            error_msg = "Нет соединения";
        }
        else {
            error_msg = response.status + " " + 
                        response.statusText + "\n" + 
                        response.responseText;
        }
        showImgGenError(error_msg);
    });
}

function getTaskResult_Processing(taskID) {
    // возвращает результат задачи: генерация картины
    console.log("getTaskResult_Processing");

    let request = getTaskStatusRequest(taskID);

    request.done((response) => {
        if (!response.task_result) {
            setTimeout(function() {
                getTaskResult_Processing(taskID);
            }, 3000);
            return;
        }
        if (response.task_result.error) {
            showImgGenError(response.task_result.error);
            return;
        }
        runTask_CheckStatus(response.task_result.order_id);
    })

    request.fail((response) => {
        error_msg = "Ошибка при отправке запроса на генерацию\n" + 
                    response.statusText;
        showImgGenError(error_msg);
    });
}

function runTask_CheckStatus(orderID) {
    // отправляет запрос старта задачи: проверка статуса генерации
    console.log("runTask_CheckStatus");

    request = checkStatusRequest(orderID);

    request.done(function(response) {
        setTimeout(function() {
            getTaskResult_CheckStatus(response.task_id, orderID);
        }, 5000);
    });

    request.fail(function(response) {
        if (response.status == "0") {
            error_msg = "Нет соединения";
        }
        else {
            error_msg = response.status + " " + 
                        response.statusText + "\n" + 
                        response.responseText;
        }
        showImgGenError(error_msg);
    });
}

function getTaskResult_CheckStatus(taskID, orderID) {
    // возвращает результат задачи: статуса генерации картины
    console.log("getTaskResult_CheckStatus");

    let request = getTaskStatusRequest(taskID);

    request.done((response) => {
        if (!response.task_result) {
            setTimeout(function() {
                getTaskResult_CheckStatus(taskID, orderID);
            }, 3000);
            return;
        }
        if (response.task_result.error) {
            showImgGenError(response.task_result.error);
            return;
        }
        if (response.task_result.order_status === "error") {
            showImgGenError(response.task_result.order_status);
            return;
        }
        if (response.task_result.order_status === "completed") {
            $("#generation_status").text("Картина завершена!");
            runTask_GetResults(orderID);
            return;
        }
        if (response.task_result.order_status === "processing") {
            $("#generation_status").text("Картина в процессе генерации...");
        }
        else {
            let queue_place = response.task_result.order_status.split(" ")[-1];
            $("#generation_status").text("Картина в очереди... Место: " + queue_place);
        }
        setTimeout(function() {
            runTask_CheckStatus(orderID);
        }, 3000);
        return;
    })

    request.fail((response) => {
        error_msg = "Ошибка при проверке статуса генерации\n" + 
                    response.statusText;
        showImgGenError(error_msg);
    });
}

function runTask_GetResults(orderID) {
    // отправляет запрос старта задачи: получение результата генерации картины
    console.log("runTask_GetResults");

    request = getResultsRequest(orderID);

    request.done(function(response) {
        setTimeout(function() {
            getTaskResult_GetResults(response.task_id);
            $("#generation_status").text("Получение картины...");
        }, 3000);
    });

    request.fail(function(response) {
        if (response.status == "0") {
            error_msg = "Нет соединения";
        }
        else {
            error_msg = response.status + " " + 
                        response.statusText + "\n" + 
                        response.responseText;
        }
        showImgGenError(error_msg);
    });
}

function getTaskResult_GetResults(taskID) {
    // возвращает результат задачи: получение результата генерации
    console.log("getTaskResult_GetResults");

    let request = getTaskStatusRequest(taskID);

    request.done((response) => {
        if (!response.task_result) {
            setTimeout(function() {
                getTaskResult_GetResults(taskID);
            }, 3000);
            return;
        }
        if (response.task_result.error) {
            showImgGenError(response.task_result.error);
            return;
        }
        showImgGenResult(response.task_result.order_result);
    })

    request.fail((response) => {
        error_msg = "Ошибка при получении результата генерации\n" + 
                    response.statusText;
        showImgGenError(error_msg);
    });
}


// ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ
function showImgGenResult(order_result) {
    // показ окна с успешным результатом генерации

    let newImage = new Image();
    newImage.src = `data:image/png;base64,${order_result.imgs[0]}`;
    $("#result_image").html(newImage);

    $("#result_prompt span").text($("#id_prompt").val());
    let neg_prompt = $("#id_neg_prompt").val();
    if (neg_prompt) {
        $("#result_neg_prompt span").text(neg_prompt);
        $("#result_neg_prompt").removeClass("hidden");
    }

    $("#save-prompt-result-btn").removeClass("hidden disabled");
    $("#loader_section").addClass("hidden");
    $("#result_section").removeClass("hidden");
}

function showImgGenError(error) {
    // показ окна с ошибкой генерации

    $("#result_prompt span").text($("#id_prompt").val());
    $("#result_error span").text(error);
    $("#result_error").removeClass("hidden");
    $("#result_image img").remove();
    $("#save-prompt-result-btn").addClass("hidden");
    $("#loader_section").addClass("hidden");
    $("#result_section").removeClass("hidden");
}

function resetPromptSection() {
    // возвращает окна к изначальному состоянию для нового запроса

    $("#new_prompt_form").trigger("reset");
    $("#prompt_section").removeClass("hidden");
    $("#result_section").addClass("hidden");
    $("#result_neg_prompt").addClass("hidden");
    $("#result_error").addClass("hidden");
    $("#save-prompt-result-btn").removeClass("hidden disabled");
    $("#result_image img").remove();
}


// УПРАВЛЕНИЕ КОЛЛЕКЦИЕЙ
function saveImageToCollection() {
    // сохраняет результат генерации в коллекцию пользователя
    console.log("saveImageToCollection");

    let request = saveImageRequest();

    request.done(function(response) {
        showSuccessAlert("Картина сохранена в коллекцию");
        $("#save-prompt-result-btn").addClass("disabled");
        // добавить картину на страницу в окно коллекции
        // TODO
        console.log("response", response);

        let data = response.responseJSON.generated_image;

        let imageID = data.id;
        let thumbnailURL = data.thumbnail.url;
        let imageURL = data.image.url;
        let imagePrompt = data.prompt;
        let imageNegPrompt = data.neg_prompt;

        let new_preview = $(
            '<div class="generated-image-preview"' + 
            'id="generated-image-preview-' + imageID + '"></div>'
        ).append(
            $('<img src="' + thumbnailURL + '" data-bs-toggle="modal" '+
            'data-bs-target="#generated-image-modal-' + imageID + '">')
        )

        let new_modal = $(".generated-image-modal.blank").clone();
        new_modal.attr("id", "generated-image-modal-"+imageID);
        new_modal.attr("data-id", imageID);
        new_modal.find(".generated-image").attr("src", imageURL);
        new_modal.find(".prompt").text(imagePrompt);
        if (imageNegPrompt) {
            new_modal.find(".neg_prompt").text(imageNegPrompt);
        }
        else {
            new_modal.find(".neg_prompt").closest("p").remove();
        }
        
        $("#collection-content").prepend(new_modal);
        $("#collection-content").prepend(new_preview);
        $(".repeat-saved-prompt-btn").on("click", repeatPromptFromCollection);
        $(".delete-saved-image-btn").on("click", deleteImageFromCollection);
        $("#collection_section").removeClass("hidden");
    });

    request.fail(function(response) {
        showDangerAlert(response.status + " " + response.responseText);
    });
}

function deleteImageFromCollection() {
    // удаляет результат генерации из коллекции пользователя
    console.log("deleteImageFromCollection")

    let modal = $(this).closest(".generated-image-modal");
    let imageID = modal.data("id");
    let request = deleteImageRequest(imageID);

    request.done(function() {
        showSuccessAlert("Картина удалена из коллекции");
        // удалить картину со страницы
        modal.find(".btn-close").trigger("click");
        modal.remove();
        $("#generated-image-preview-"+imageID).remove();
        // скрыть коллекцию, если не осталось картин
        let left_imgs = $("#collection-content .generated-image-preview").length;
        if (left_imgs == 0) {
            $("#collection_section").addClass("hidden");
        }
    });
    
    request.fail(function(response) {
        showDangerAlert(response.status + " " + response.responseText);
    });
}


// УТИЛИТЫ
function DataURIToBlob(dataURI) {
    // base64 img -> файл для formData 

    const splitDataURI = dataURI.split(',');
    const byteString = splitDataURI[0].
        indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i)

    return new Blob([ia], { type: mimeString })
}
