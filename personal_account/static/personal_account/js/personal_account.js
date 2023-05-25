$(document).ready(function () {
    $("#new_prompt_form").on("submit", startNewGeneration);
    $("#repeat-prompt-btn").on("click", startNewGeneration);
    $("#edit-prompt-btn").on("click", editPromptSection);
    $("#reset-prompt-btn").on("click", resetPromptSection);
    $("#save-prompt-result-btn").on("click", saveImageToCollection);
    $(".repeat-saved-prompt-btn").on("click", repeatPromptFromCollection);
    $(".delete-saved-image-btn").on("click", deleteImageFromCollection);
    controlArrowsInModalGroups();
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
        url: "/personal_account/ajax/save_generated_image",
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

    // проверка, что генерация не идет уже
    if (!$("#loader_section").hasClass("hidden")) {
        showDangerAlert("Дождитесь окончания генерации!");
        return;
    }

    let cur_item = $(this).closest(".carousel-item");
    let prompt = cur_item.find(".prompt").text();
    let neg_prompt = cur_item.find(".neg_prompt").text();

    $("#id_prompt").val(prompt);
    $("#id_neg_prompt").val(neg_prompt);

    $(this).closest(".modal").find(".btn-close").trigger("click");
    $("#prompt_section").addClass("hidden");
    $("#result_section").addClass("hidden");
    $("#result_error").addClass("hidden");
    $("#loader_section").removeClass("hidden");
    $("#result_image img").remove();

    runTask_Processing();
}


// ПРОЦЕСС ГЕНЕРАЦИИ
function runTask_Processing() {
    // отправляет запрос старта задачи: генерация картины
    console.log("runTask_Processing");

    let request = sendNewPromptRequest();
    $("#generation_status").text(" ");

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
            let queue_place = response.task_result.order_status.split(" ").pop();
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

function editPromptSection() {
    // показывает окно промта для редактирования

    $("#result_section").addClass("hidden");
    $("#result_error").addClass("hidden");
    $("#save-prompt-result-btn").removeClass("hidden disabled");
    $("#result_image img").remove();
    $("#prompt_section").removeClass("hidden");
}

function resetPromptSection() {
    // возвращает окна к изначальному состоянию для нового запроса

    $("#new_prompt_form").trigger("reset");
    $("#result_section").addClass("hidden");
    $("#result_neg_prompt").addClass("hidden");
    $("#result_error").addClass("hidden");
    $("#save-prompt-result-btn").removeClass("hidden disabled");
    $("#result_image img").remove();
    $("#prompt_section").removeClass("hidden");
}


// УПРАВЛЕНИЕ КОЛЛЕКЦИЕЙ
function saveImageToCollection() {
    // сохраняет результат генерации в коллекцию пользователя
    console.log("saveImageToCollection");

    // деактивация кнопки сохранения
    $(this).addClass("disabled");

    let request = saveImageRequest();

    request.done(function(response) {
        showSuccessAlert("Картина сохранена в коллекцию");

        let group_exist = false;
        let new_preview = $('<img src="" id="">');
        new_preview.attr("src", response.thumbnail_url);
        new_preview.attr("id", "generated-image-preview-" + response.id);
        
        // если такой промт уже был - вставляем в существующую группу
        $(".generated-image-group-preview").each(function() {
            if ($(this).attr("data-prompt") == response.prompt) {
                group_exist = true;
                let group_preview = $(this);
                group_preview.prepend(new_preview);
                
                let counter = group_preview.attr("id").slice(8);
                let group_modal = $('#modal-' + counter);
                group_modal.find(".active").removeClass("active");

                let new_item = $(".generated-image-group-modal.blank .carousel-item").clone();
                fillNewItem(new_item, response);
                group_modal.find(".carousel-inner").append(new_item);

                group_modal.find(".carousel-control-prev").show();
                group_modal.find(".carousel-control-next").show();
                return;
            }
        })
        // если такого промта еще не было - делаем новую группу
        if (!group_exist) {
            let counter = $(".generated-image-group-preview").length + 1;

            let new_group_preview = $('<div data-bs-toggle="modal">');
            new_group_preview.addClass("generated-image-group-preview");
            new_group_preview.attr("data-bs-target", "#modal-" + counter);
            new_group_preview.attr("data-prompt", response.prompt);
            new_group_preview.attr("id", "preview-" + counter);
            new_group_preview.removeClass("blank");
            new_group_preview.prepend(new_preview);
            $("#collection-content").prepend(new_group_preview);

            let new_group_modal = $(".generated-image-group-modal.blank").clone();
            new_group_modal.removeClass("blank");
            new_group_modal.attr("id", "modal-" + counter);
            new_group_modal.find(".carousel").attr("id", "carousel-" + counter);
            new_group_modal.find(".carousel-control-prev").attr("data-bs-target", "#carousel-" + counter).hide();
            new_group_modal.find(".carousel-control-next").attr("data-bs-target", "#carousel-" + counter).hide();

            let new_item = new_group_modal.find(".carousel-item");
            fillNewItem(new_item, response);

            $("main").append(new_group_modal);
            $("#collection_section").removeClass("hidden");
        }

        function fillNewItem(new_item, response) {
            new_item.find(".generated-image-container img").attr("src", response.image_url);
            new_item.find(".prompt").text(response.prompt);
            if (response.neg_prompt) {
                new_item.find(".neg_prompt").text(response.neg_prompt);
            }
            else new_item.find(".neg_prompt").closest("p").remove();
            new_item.find(".delete-saved-image-btn").attr("data-item-id", response.id);
            new_item.find(".repeat-saved-prompt-btn").on("click", repeatPromptFromCollection);
            new_item.find(".delete-saved-image-btn").on("click", deleteImageFromCollection);
        }
    });

    request.fail(function(response) {
        $("#save-prompt-result-btn").removeClass("disabled");
        showDangerAlert(response.status + " " + response.responseText);
    });
}

function deleteImageFromCollection() {
    // удаляет результат генерации из коллекции пользователя
    console.log("deleteImageFromCollection")

    let modal = $(this).closest(".generated-image-group-modal");
    let item = $(this).closest(".carousel-item");
    let imageID = $(this).attr("data-item-id");
    let request = deleteImageRequest(imageID);

    request.done(function() {
        showSuccessAlert("Картина удалена из коллекции");
        // закрыть модальное окно
        modal.find(".btn-close").trigger("click");

        // удалить элемент из модального окна
        item.remove();
        // если не осталось элементов - удалить модальное окно
        if (modal.find(".carousel-item").length == 0) {
            modal.remove();
        }
        else if ((modal.find(".carousel-item").length == 1)) {
            modal.find(".carousel-control-prev").hide();
            modal.find(".carousel-control-next").hide();
            modal.find(".carousel-item").addClass("active");
        }
        else {
            modal.find(".carousel-item").first().addClass("active");
        }

        let preview = $("#generated-image-preview-" + imageID);
        let preview_group = preview.closest(".generated-image-group-preview");
        preview.remove();

        if (preview_group.find("img").length == 0) {
            preview_group.remove();
        }

        // скрыть коллекцию, если не осталось картин
        let left_imgs = $("#collection-content .generated-image-group-preview").length;
        if (left_imgs == 0) {
            $("#collection_section").addClass("hidden");
        }
    });
    
    request.fail(function(response) {
        showDangerAlert(response.status + " " + response.responseText);
    });
}

function controlArrowsInModalGroups() {
    // скрывает стрелки влево-вправо, если элемент в модальном окне один

    $(".generated-image-group-modal .carousel").each(function() {
        let items = $(this).find(".carousel-item");
        if (items.length < 2) {
            $(this).find(".carousel-control-prev").hide();
            $(this).find(".carousel-control-next").hide();
        }
    })
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
