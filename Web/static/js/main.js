const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// await _sleep(2000);

async function loading_effect(num_step) {
    $(".loading").show();
    $(".bar").css("width", "0%");
    $(".prog-text").text("モデルをロード中...");
    await _sleep(2000);
    $(".prog-text").text("生成中...");
    for (let i = 0; i <= num_step; i++) {
        $(".bar").css("width", (i / num_step) * 100 + "%");
        await _sleep(200);
        console.log((i / num_step) * 100 + "%");
    }
    $(".prog-text").text("ロード中...");
}

function outputSelectedValueAndText(obj) {
    let idx = obj.selectedIndex;
    let value = obj.options[idx].value; // 値
    $(".model-info").hide();
    $("#" + value).show();
}

$(document).ready(function () {
    $("#send").on("click", async function () {
        $("#send-div").hide();
        let prompt = $("#input_prompt").val();
        let negative_prompt = $("#negative_prompt").val();
        let model = $("#model").val();
        let seed = $("#seed").val();
        let num_step = $("#num-step").val();
        loading_effect(num_step);
        let res = await (await fetch("https://syuuma0209--syuuma-stable-diffusion-web-main.modal.run?prompt=" + prompt)).json();
        console.log(res.image);
        $(".loading").hide();
        $(".image").attr("src", "data:image/png;base64," + res.image);
        $("#send-div").show();
    });
});
