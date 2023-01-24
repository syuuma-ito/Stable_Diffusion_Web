const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// await _sleep(2000);

async function loading_effect(num_step) {
    $(".loading").show();
    for (let i = 0; i <= num_step; i++) {
        $(".bar").css("width", (i / num_step) * 100 + "%");
        await _sleep(314);
    }
}

$(document).ready(function () {
    $("#send").on("click", async function () {
        let prompt = $("#input_prompt").val();
        let num_step = $("num-step").val();
        console.log(prompt);
        loading_effect(num_step);
        fetch("https://2ctn99fmhn-496ff2e9c6d22116-8000-colab.googleusercontent.com/test?prompt=%22%22&negative_prompt=%22%22&seed=%220%22", {
            method: "GET",
            mode: "cors",
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                // 404 や 500 ステータスならここに到達する
                throw new Error("Network response was not ok.");
            })
            .then((resJson) => {
                console.log(JSON.stringify(resJson));
            })
            .catch((error) => {
                // ネットワークエラーの場合はここに到達する
                console.error(error);
            });
    });
});
