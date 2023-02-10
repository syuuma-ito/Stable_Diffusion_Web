const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const model_url = "https://syuuma0209--syuuma-stable-diffusion-web-main.modal.run";
const model_test_url = "https://syuuma0209--syuuma-stable-diffusion-web-main-dev.modal.run";

let is_generation_complete = true;

async function loading_effect(num_step) {
    $(".loading").show();
    $(".bar").css("width", "0%");
    $(".prog-text").text("モデルをロード中...");
    await _sleep(2000);
    $(".prog-text").text("生成中...");
    for (let i = 0; i <= num_step; i++) {
        $(".bar").css("width", (i / num_step) * 100 + "%");
        await _sleep(200);
        if (is_generation_complete) {
            return;
        }
    }
    $(".prog-text").text("ロード中...");
}

function outputSelectedValueAndText(obj) {
    let idx = obj.selectedIndex;
    let value = obj.options[idx].value; // 値
    $(".model-info").hide();
    $("#" + value).show();
}

//&allows_NSWF=True

$(document).ready(function () {
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
        try {
            let res = await (await fetch(model_url + "?prompt=" + prompt + "&allows_NSWF=" + allows_NSWF + "&negative_prompt=" + negative_prompt + "&seed=" + seed + "&num_inference_steps=" + num_step)).json();

            if (res.isOK == false) {
                $("#send-div").show();
                is_generation_complete = true;
                $(".loading").hide();
                $(".text-info").html("エラーが起きたみたい<br />ちょっと待っててね<br /><br />" + res.reason);
                return;
            }

            is_generation_complete = true;
            $(".loading").hide();
            if (res.image_info.NSFW) {
                $(".text-info").html("表示できないイラストが生成されちゃったみたい<br />入力する文を変えてみてね<br /><br /><br /><br /><br />表示する場合は、詳細設定からR18のイラストを許可してください");
                $(".text-info").show();
                $(".image-info").html("");
                Object.keys(res.image_info).forEach((item) => {
                    $(".image-info").append(`<p>${item} = ${res.image_info[item]}</p>`);
                });
            } else {
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
        }
    });
});
