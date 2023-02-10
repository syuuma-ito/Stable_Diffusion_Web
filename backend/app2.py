import modal

stub = modal.Stub("syuuma_stable_diffusion_web")

device = "cuda"
cache_path = "/vol/cache"


def download_models():
    import diffusers
    import torch

    # "andite/anything-v4.0",
    # Downloads all other models.
    pipe = diffusers.StableDiffusionPipeline.from_pretrained(
        "andite/anything-v4.0",
        torch_dtype=torch.float16,
        low_cpu_mem_usage=False,
        custom_pipeline="lpw_stable_diffusion",  # プロンプトの長さを制限なしに
    )
    pipe.save_pretrained(cache_path, safe_serialization=True)


image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "accelerate",
        "diffusers",
        "ftfy",
        "torch",
        "torchvision",
        "transformers",
        "triton",
        "safetensors",
        "huggingface_hub",
        "deep-translator",
    )
    .pip_install("xformers", pre=True)
    .run_function(
        download_models,
    )
)
stub.image = image


@stub.function(gpu="A10G")
async def run_stable_diffusion(prompt: str,  allows_NSWF: bool, **kwargs):
    kwargs = {k: v for k, v in kwargs.items() if v is not None}
    negative_prompt = kwargs.pop('negative_prompt', "")
    guidance_scale = kwargs.pop('guidance_scale', 7.5)
    num_inference_steps = kwargs.pop('num_inference_steps', 100)
    height = kwargs.pop('height', 512)
    width = kwargs.pop('width', 512)
    input_seed = kwargs.pop('seed', 0)

    if not len(kwargs) == 0:
        print(f"unknow arg : {kwargs}")

    import torch
    from diffusers import StableDiffusionPipeline
    from torch import autocast

    # パイプライン読み込み
    pipe = StableDiffusionPipeline.from_pretrained(
        cache_path,
        custom_pipeline="lpw_stable_diffusion",  # プロンプトの長さを制限なしに
    ).to(device)
    pipe.enable_xformers_memory_efficient_attention()

    # NSWFフィルターを削除(黒塗り回避) (これによりエロ、グロ画像が生成可能になります) (閲覧注意)
    if allows_NSWF:
        print("NSWFフィルターを削除")
        pipe.safety_checker = lambda images, **kwargs: (images, False)

    # ランダムなシードを生成
    if input_seed == 0:
        input_seed = torch.Generator(device=device).seed()
        generator = torch.Generator(device=device).manual_seed(int(input_seed))
    else:
        generator = torch.Generator(device=device).manual_seed(int(input_seed))

    #
    #
    #
    # =================================================================
    # プロンプトの設定
    default_prompt = ""
    default_prompt += "4k, 8k, super fine illustration, masterpiece, {{delicate composition}}, "

    prompt = default_prompt + prompt

    default_negative_prompt = ""
    # 画質
    default_negative_prompt += "flat color, flat shading, blender, retro style, poor quality, worst quality, low quality, normal quality, error, lowere, jpeg artifacts, extra digit, fewer digits, chromatic aberration, "
    # テキストを消す
    default_negative_prompt += "signature, watermark, username, artist name, tittle, signature, watermark, "
    # 色
    default_negative_prompt += "grayscale, monochrome, "
    # 構図
    default_negative_prompt += "cropped, panel layout"
    # キャラ
    default_negative_prompt += "eye shadow, asymmetrical bangs, expressionless, blank stare, {{{fat}}}, "
    # 指や体の変形を軽減
    default_negative_prompt += "bad fingers, bad anatomy, missing fingers, bad feet, bad hands, long body, "
    # エロ軽減
    # default_negative_prompt += "{{{{{{{{{{NSWF}}}}}}}}}}, "

    negative_prompt = default_negative_prompt + negative_prompt

    print("--------------------------------------------------------------------------------------------")
    print(f"prompt = {prompt}")
    print("--------------------------------------------------------------------------------------------")
    print(f"prompt = {negative_prompt}")
    print("--------------------------------------------------------------------------------------------")
    print(f"seed = {input_seed}")
    print("--------------------------------------------------------------------------------------------")
    print(f"steps = {num_inference_steps}")
    print("--------------------------------------------------------------------------------------------")

    with autocast(device):
        image = pipe(
            prompt,
            negative_prompt=negative_prompt,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator,
            height=height,
            width=width,
            max_embeddings_multiples=10,
        )
    print(image)

    image_info = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
        "seed": input_seed,
        "height": height,
        "width": width,
        "NSFW": image["nsfw_content_detected"],
    }

    return image[0][0], image_info


def pil_to_base64(img):
    import base64
    from io import BytesIO

    buffer = BytesIO()
    img.save(buffer, "png")
    img_str = base64.b64encode(buffer.getvalue()).decode("ascii")

    return img_str


@stub.webhook
def main(
        prompt: str = "",
        allows_NSWF: bool = False,
        negative_prompt: str = "",
        guidance_scale: int = 7.5,
        num_inference_steps: int = 100,
        height: int = 512,
        width: int = 512,
        seed: int = 0
):
    from deep_translator import GoogleTranslator

    try:
        prompt = GoogleTranslator(
            source='auto', target='en'
        ).translate(prompt)

        negative_prompt = GoogleTranslator(
            source='auto', target='en'
        ).translate(negative_prompt)

        image, image_info = run_stable_diffusion.call(
            prompt,
            allows_NSWF,
            negative_prompt=negative_prompt,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            height=height,
            width=width,
            seed=seed,
        )
        base64 = pil_to_base64(image)
        return {
            "isOK": True,
            "image": base64,
            "image_info": image_info,
        }
    except Exception as e:
        print(e)
        {"isOK": False, "reason": str(type(e)), "args": str(e.args)}
