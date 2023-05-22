$(document).ready(function () {
    $("#registration_form").on("submit", registerUser);
    $("#login_form").on("submit", loginUser);
})

function registerUser() {
    // отправляет форму регистрации, 
    // уведомляя об ошибках или направляя в аккаунт

    let form = $(this);
    let result_field = form.find(".form_result");

    result_field.text(" ");
    form.find(".helptext").remove();

    $.ajax({
        data: form.serialize(),
        type: form.attr('method'),
        url: form.attr('action'),

        success: function(response) {
            result_field.text(response);
            setTimeout(() => {
                window.location.href = "/personal_account/"
            }, 1500);
        },
        error: function(response) {
            if (response.status == "0") {
                result_field.text("Нет соединения");
            }
            else if (response.status == "400") {
                let errors = response.responseJSON;
                for (let fieldname in errors) {
                    let field = form.find("#id_" + fieldname);
                    let error = "&#8226; " + errors[fieldname].join("\n&#8226; ");
                    $('<p class="helptext"></p>').html(error).insertAfter(field);
                }
            }
            else {
                result_field.text("Возникла ошибка");
            }
        }
    });
    return false;
}

function loginUser() {
    // отправляет форму входа, 
    // уведомляя об ошибках или направляя в аккаунт
    
    let form = $(this);
    let result_field = form.find(".form_result");

    $.ajax({
        data: form.serialize(),
        type: form.attr('method'),
        url: form.attr('action'),

        success: function(response) {
            result_field.text(response);
            setTimeout(() => {
                window.location.href = "/personal_account/"
            }, 1500);
        },
        error: function(response) {
            if (response.status == "0") {
                result_field.text("Нет соединения");
            }
            else if (response.status == "403") {
                result_field.text(response.responseText);
            }
            else {
                result_field.text("Возникла ошибка");
            }
        }
    });
    return false;
}
