const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// await _sleep(2000);

async function loading_effect(num_step) {
    $(".loading").show();
    for (let i = 0; i <= num_step; i++) {
        $(".bar").css("width", (i / num_step) * 100 + "%");
        await _sleep(314);
        console.log((i / num_step) * 100 + "%");
    }
    $(".loading").hide();
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
        await loading_effect(num_step);
        $("#send-div").show();
    });
});
