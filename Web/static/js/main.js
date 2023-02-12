const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

tailwind.config = {
    darkMode: "class",
};

const model_url = "https://syuuma0209--syuuma-stable-diffusion-web-main.modal.run";
const model_test_url = "https://syuuma0209--syuuma-stable-diffusion-web-main-dev.modal.run";

let is_generation_complete = true;

async function loading_effect(num_step) {
    $(".loading").show();
    $(".bar").css("width", "0%");
    $(".prog-text").text("モデルをロード中...");
    await _sleep(4000);
    $(".prog-text").text("生成中...");
    for (let i = 0; i <= num_step; i++) {
        $(".bar").css("width", (i / num_step) * 100 + "%");
        console.log(i);
        await _sleep(80);
        if (is_generation_complete) {
            return;
        }
    }
    $(".prog-text").text("ロード中...");
}

async function notification(text) {
    $(".notification").text(text);
    $(".notification").slideDown();
    await _sleep(2000);
    $(".notification").slideUp();
}

function outputSelectedValueAndText(obj) {
    let idx = obj.selectedIndex;
    let value = obj.options[idx].value; // 値
    $(".model-info").hide();
    $("#" + value).show();
}

function clearTextArea(selecter) {
    $(selecter).val("");
}

function setDarkMode() {
    let isDark = $(".dark-setting").prop("checked");
    console.log(isDark);

    if (isDark) {
        $("html").addClass("dark");
        $.removeCookie("isDark");
        $.cookie("isDark", "True");
    } else {
        $("html").removeClass("dark");
        $.removeCookie("isDark");
        $.cookie("isDark", "False");
    }
}

async function showError(text) {
    $(".error-notification").text(text);
    $(".error-notification").slideDown();
    await _sleep(2000);
    $(".error-notification").slideUp();
}

function setDarkModeReady() {
    var isDark = $.cookie("isDark");
    if (isDark == "True") {
        $("html").addClass("dark");
        $.cookie("isDark", "True", { expires: 30, path: "/", secure: true });
        $(".dark-setting").prop("checked", true).change();
    } else {
        $("html").removeClass("dark");
        $.cookie("isDark", "False", { expires: 30, path: "/", secure: true });
        $(".dark-setting").prop("checked", false).change();
    }
}
setDarkModeReady();

function updatePreference() {
    let allows_NSWF = $("#allows_NSWF").prop("checked");
    if (allows_NSWF) {
        $.cookie("allows_NSWF", "True", { expires: 30, path: "/", secure: true });
    } else {
        $.cookie("allows_NSWF", "False", { expires: 30, path: "/", secure: true });
    }
    $.removeCookie("allows_NSWF");
}

function setPreference() {
    var allows_NSWF = $.cookie("allows_NSWF");
    if (allows_NSWF == "True") {
        $("#allows_NSWF").prop("checked", true).change();
    } else {
        $("#allows_NSWF").prop("checked", false).change();
    }
}

$(document).ready(function () {
    setDarkModeReady();
    setPreference();
    $("#send").on("click", async function () {
        $("#send-div").hide();
        $(".text-info").text("");
        let prompt = $("#input_prompt").val();
        let negative_prompt = $("#negative_prompt").val();
        let model = $("#model").val();
        let seed = $("#seed").val();
        let num_step = $("#num-step").val();
        let allows_NSWF = $("#allows_NSWF").prop("checked");
        if (allows_NSWF) {
            allows_NSWF = "True";
        } else {
            allows_NSWF = "False";
        }
        is_generation_complete = false;
        loading_effect(num_step);
        $(".text-info").html("生成後、ここに表示されるよ");
        $(".ai-image-image").html("");
        try {
            let res = await (await fetch(model_url + "?prompt=" + prompt + "&allows_NSWF=" + allows_NSWF + "&negative_prompt=" + negative_prompt + "&seed=" + seed + "&num_inference_steps=" + num_step)).json();

            if (res.isOK == false) {
                $("#send-div").show();
                is_generation_complete = true;
                $(".loading").hide();
                $(".text-info").html("エラーが起きたみたい<br />ちょっと待っててね<br /><br />" + res.reason);
                showError("サーバーエラー");
                return;
            }

            is_generation_complete = true;
            $(".loading").hide();
            if (res.image_info.NSFW) {
                $(".text-info").html("表示できないイラストが生成されちゃったみたい<br />入力する文を変えてみてね<br /><br /><br /><br /><br />表示する場合は、詳細設定からR18のイラストを許可してください");
                $(".text-info").show();
                $(".image-info").html("");
                notification("生成が完了しました");
                Object.keys(res.image_info).forEach((item) => {
                    $(".image-info").append(`<p>${item} = ${res.image_info[item]}</p>`);
                });
            } else {
                notification("生成が完了しました");
                $(".text-info").hide();
                $(".ai-image-image").html('<img decoding="async" class="image" src="data:image/png;base64,' + res.image + '" alt="' + prompt + '" />');
                $(".image-info").html("");
                Object.keys(res.image_info).forEach((item) => {
                    $(".image-info").append(`<p>${item} = ${res.image_info[item]}</p>`);
                });
            }
            $("#send-div").show();
        } catch (e) {
            console.log("エラー" + e.message);
            $("#send-div").show();
            is_generation_complete = true;
            $(".loading").hide();
            $(".text-info").html("エラーが起きたみたい<br />ちょっと待っててね<br /><br />" + e.message);
            showError("エラー");
        }
    });
});
