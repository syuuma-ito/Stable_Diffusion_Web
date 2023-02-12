import time

import requests

url = 'https://syuuma0209--syuuma-stable-diffusion-web-main-dev.modal.run?curl=True'

while True:
    r = requests.get(url)
    print(r.text)
    time.sleep(30)
