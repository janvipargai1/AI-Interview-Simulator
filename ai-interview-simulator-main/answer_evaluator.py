from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise RuntimeError("GOOGLE_API_KEY not found. Check your .env file.")

client = genai.Client(api_key=api_key)


def evaluate_answer(question, answer, experience):
    prompt = f"""
You are a technical interviewer.

Question:
{question}

Candidate Answer:
{answer}

Experience Level:
{experience}

Evaluate strictly and respond in JSON ONLY:

{{
  "technical": number between 0 and 10,
  "clarity": number between 0 and 10,
  "confidence": number between 0 and 10,
  "filler_words": "yes" or "no"
}}
"""

    response = client.models.generate_content(
        model="models/gemini-flash-latest",
        contents=prompt
    )

    try:
        return json.loads(response.text)
    except Exception:
        return {
            "technical": 0,
            "clarity": 0,
            "confidence": 0,
            "filler_words": "unknown"
        }
