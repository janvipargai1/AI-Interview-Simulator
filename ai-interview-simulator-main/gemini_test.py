from google import genai
import os

# Create client using your API key from environment
client = genai.Client(api_key=os.getenv("AIzaSyAXPaGSgPx3l0ZploBudiDNpIMU4EswV_Y"))

response = client.models.generate_content(
    model="models/gemini-flash-latest",
    contents="Give me 3 Python interview questions for a fresher"
)

print("\n--- Gemini Response ---\n")
print(response.text)