from google import genai
import os

client = genai.Client(api_key=os.getenv("AIzaSyAGZ0hUmOzF8b9f-8y74qwsIkz6xcFlY7M"))

models = client.models.list()

for m in models:
    print(m.name)