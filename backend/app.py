import modal

stub = modal.Stub()

device = "cuda"
cache_path = "/vol/cache"


# モデルを定義
models = {
    "anything": {
        "model_id": "andite/anything-v4.0",
        "save_name_t2i": "anything_t2i",
        "save_name_i2i": "anyrhing_i2i"
    }
}


def download_model_txt2img(model_id: str, save_name: str):
    # モデルをダウンロードし、保存
    import diffusers
    import torch

    print("downloading_models...")
    print("model_id = " + model_id)

    pipe = diffusers.StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        low_cpu_mem_usage=False,
        custom_pipeline="lpw_stable_diffusion",  # プロンプトの長さを制限なしに
    )
    pipe.save_pretrained(f"{cache_path}/{save_name}", safe_serialization=True)
    print(f'saved_pipe!! at "{cache_path}/{save_name}"')


@stub.function(
    gpu="A10G",
    image=(
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
        )
        .pip_install("xformers", pre=True)
        .run_function(
            download_model_txt2img(
                models["anything"]["model_id"],
                models["anything"]["save_name_t2i"]),
        )
    )
)
async def anyrhing_txt2img(prompt: str, allows_NSWF: bool, **kwargs):
    # 引数チェック
    negative_prompt = kwargs.pop('negative_prompt', "")
    guidance_scale = kwargs.pop('guidance_scale', 7.5)
    num_inference_steps = kwargs.pop('num_inference_steps', 20)
    height = kwargs.pop('height', 512)
    width = kwargs.pop('width', 512)
    input_seed = kwargs.pop('seed', 0)

    if not len(kwargs) == 0:
        print(f"unknow arg : {kwargs}")

    import torch
    from diffusers import StableDiffusionPipeline
    from torch import autocast

    # ランダムなシードを生成
    if input_seed == 0:
        input_seed = torch.Generator(device=device).seed()
        generator = torch.Generator(device=device).manual_seed(int(input_seed))
    else:
        generator = torch.Generator(device=device).manual_seed(int(input_seed))

    pipe = StableDiffusionPipeline.from_pretrained(
        models["anything"]["save_name_t2i"],
        custom_pipeline="lpw_stable_diffusion",  # プロンプトの長さを制限なしに
    ).to(device)
    pipe.enable_xformers_memory_efficient_attention()

    # NSWFフィルターを削除(黒塗り回避) (これによりエロ、グロ画像が生成可能になります) (閲覧注意)
    if allows_NSWF:
        pipe.safety_checker = lambda images, **kwargs: (images, False)

    print("--------------------------------------------------------------------------------------------")
    print(f"prompt = {prompt}")
    print("--------------------------------------------------------------------------------------------")
    print(f"negative_prompt = {kwargs.get('negative_prompt')}")
    print("--------------------------------------------------------------------------------------------")
    print(f"seed = {input_seed}")
    print("--------------------------------------------------------------------------------------------")

    with autocast(device):
        image = pipe(
            prompt,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator,
            height=height,
            width=width,
            max_embeddings_multiples=10,
        )[0][0]

    return image


@ stub.local_entrypoint
def main():
    image = anyrhing_txt2img.call(
        "masterpiece,{{1girl}},love story game cg,{{{{white background,white illustration}}},{round branch},fluttering petals,wavy hair,profile,shiny outline,floating hair,flat color girl,eyelashes,monochrome, white hair,white clothes, watercolor (medium),luminous iridescent glowing flower,colorful flower,shiny flower,flower hair ornaments,turquoise flower,flower reflection,branch, {{flower made of glass}},{pink flower}, powder light in flower",
        guidance_scale=7.5,
        num_inference_steps=50,
        seed=0,
    )
    image.save("test.png")
