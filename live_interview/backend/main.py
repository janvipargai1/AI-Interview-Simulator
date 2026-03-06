from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from dotenv import load_dotenv
import whisper

load_dotenv()

from resume_parser import extract_text_from_resume, extract_skills, extract_experience
from question_generator import generate_questions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model once
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded.")

# Store questions in memory for now
QUESTIONS = []

@app.get("/")
def root():
    return {"status": "Backend running"}

# -------- Resume Upload --------
@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        temp_path = tmp.name

    # Use your existing logic
    text = extract_text_from_resume(temp_path)
    skills = extract_skills(text)
    experience = extract_experience(text)

    # Cleanup
    os.remove(temp_path)

    experience = (experience or "fresher").lower()

    return {
        "skills": skills,
        "experience": experience
    }

# -------- Generate Questions --------
@app.post("/generate_questions")
def gen_questions(data: dict = Body(...)):
    global QUESTIONS
    skills = data.get("skills", [])
    experience = data.get("experience", "fresher")

    print("SKILLS:", skills)
    print("EXPERIENCE:", experience)

    try:
        QUESTIONS = generate_questions(skills, experience, num_questions=5)
        print("QUESTIONS FROM GEMINI:", QUESTIONS)
    except Exception as e:
        print("ERROR IN generate_questions():", e)
        return {"questions": [], "error": str(e)}

    return {"questions": QUESTIONS}

@app.get("/questions")
def get_questions():
    return {"questions": QUESTIONS}

# -------- Speech to Text (Whisper) --------
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Save uploaded audio temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        audio_bytes = await file.read()
        tmp.write(audio_bytes)
        temp_audio_path = tmp.name

    try:
        print("Transcribing audio:", temp_audio_path)
        result = whisper_model.transcribe(temp_audio_path)
        text = result.get("text", "")
        print("Transcription:", text)
    except Exception as e:
        print("Transcription error:", e)
        return {"text": "", "error": str(e)}
    finally:
        # Cleanup temp file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

    return {"text": text}
