// ОБЩИЕ УВЕДОМЛЕНИЯ
const success_alert = $("#success-alert");
const danger_alert = $("#danger-alert");

$(document).ready(function() {
    $(".alert .btn-close").on("click", hideAlert);
})

function showSuccessAlert(msg) {
    success_alert.find(".text").text("");
    success_alert.find(".text").text(msg);

    success_alert.addClass("active");
    setTimeout(() => {
        success_alert.removeClass("active");
    }, 4000);
}

function showDangerAlert(msg) {
    if (msg === "0 undefined") {
        msg = "Нет соединения!"
    }
    danger_alert.find(".text").text("");
    danger_alert.find(".text").text(msg);

    danger_alert.addClass("active");
    setTimeout(() => {
        danger_alert.removeClass("active");
    }, 4000);
}

function hideAlert() {
    success_alert.removeClass("active");
    danger_alert.removeClass("active");
}
