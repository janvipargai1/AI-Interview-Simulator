import streamlit as st
import tempfile

from resume_parser import (
    extract_text_from_resume,
    extract_skills,
    extract_experience
)
from question_generator import generate_questions


# ---------------- SESSION STATE INIT ----------------
st.session_state.setdefault("analyzed", False)
st.session_state.setdefault("final_skills", [])
st.session_state.setdefault("experience", "fresher")
st.session_state.setdefault("questions", [])
st.session_state.setdefault("q_index", 0)
st.session_state.setdefault("last_spoken_index", -1)


# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="AI Interview Simulator",
    layout="centered"
)


# ---------------- CONSTANTS ----------------
EXPERIENCE_OPTIONS = ["fresher", "junior", "mid", "senior"]


# ================= HOME PAGE =================

# -------- HEADER --------
st.markdown("<h2>AI Interview Simulator</h2>", unsafe_allow_html=True)
st.markdown(
    "<p style='color:gray'>Resume Analysis & Interview Preparation</p>",
    unsafe_allow_html=True
)
st.divider()

# -------- FILE UPLOAD --------
st.subheader("Resume Analysis")

uploaded_file = st.file_uploader(
    "Upload your resume (PDF only)",
    type=["pdf"]
)

if uploaded_file:
    st.success("Resume uploaded successfully.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(uploaded_file.read())
        temp_path = tmp.name

    if st.button("Analyze Resume"):
        with st.spinner("Analyzing resume..."):
            text = extract_text_from_resume(temp_path)
            skills = extract_skills(text)
            experience = extract_experience(text)

        experience = experience.lower() if experience else "fresher"
        if experience not in EXPERIENCE_OPTIONS:
            experience = "fresher"

        st.session_state.final_skills = skills
        st.session_state.experience = experience
        st.session_state.analyzed = True
        st.session_state.questions = []

# -------- AFTER ANALYSIS --------
if st.session_state.analyzed:

    st.divider()
    st.subheader("Analysis Result")

    # Skills
    st.session_state.final_skills = st.multiselect(
        "Detected Skills (edit if needed):",
        options=st.session_state.final_skills,
        default=st.session_state.final_skills
    )

    # Add skill manually
    with st.form("add_skill_form"):
        new_skill = st.text_input("Add a skill")
        submitted = st.form_submit_button("Add")

        if submitted and new_skill:
            new_skill = new_skill.strip().lower()
            if new_skill not in st.session_state.final_skills:
                st.session_state.final_skills.append(new_skill)
                st.success(f"Added skill: {new_skill}")
            else:
                st.warning("Skill already exists.")

    # Experience
    st.divider()
    st.session_state.experience = st.selectbox(
        "Confirm your experience level",
        EXPERIENCE_OPTIONS,
        index=EXPERIENCE_OPTIONS.index(
            st.session_state.experience
            if st.session_state.experience in EXPERIENCE_OPTIONS
            else "fresher"
        )
    )

    # Question generation
    st.divider()
    st.subheader("Interview Question Generator")

    if st.button(
        "Generate Interview Questions",
        disabled=not st.session_state.final_skills
    ):
        with st.spinner("Generating questions using Gemini..."):
            st.session_state.questions = generate_questions(
                st.session_state.final_skills,
                st.session_state.experience,
                num_questions=5
            )

    # After questions generated
    if st.session_state.questions:
        st.success("✅ Interview questions generated successfully.")

        if st.button("🎤 Start Interview"):
            st.session_state.q_index = 0
            st.session_state.last_spoken_index = -1
            st.switch_page("pages/Interview.py")   # ✅ Switches sidebar page
