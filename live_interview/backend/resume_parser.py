import pdfplumber
import re

#loading skills map
SKILLS_MAP = {
"python": ["python"],
"java": ["java"],
"c++": ["c++", "cpp"],
"machine learning": ["machine learning", "ml"],
"deep learning": ["deep learning", "dl"],
"natural language processing": ["nlp", "natural language processing"],
"computer vision": ["cv", "computer vision"],
"data science": ["data science"],
"sql": ["sql"],
"dbms": ["dbms"],
"html": ["html"],
"css": ["css"],
"javascript": ["javascript", "js"],
"tensorflow": ["tensorflow"],
"pytorch": ["pytorch"],
"opencv": ["opencv"],
"aws": ["aws", "amazon web services"],
"mongoDB": ["mongodb", "mongo db"],
"react": ["react", "react.js", "reactjs"],
"node.js": ["node.js", "nodejs", "node"],
"docker": ["docker"],
"spring": ["spring", "spring boot"],
"git": ["git"],
"linux": ["linux"],
"agile": ["agile"],
"scrum": ["scrum"]


}
#extracting text
def extract_text_from_resume(pdf_path):
    text=""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text=page.extract_text()
            if page_text:
                text+=page_text+"\n"
    return text.lower()

#extracting skills
def extract_skills(text):
    found=[]
    for skill,variants in SKILLS_MAP.items():
        for v in variants:
            if v in text:
                found.append(skill)
                break
    return list(set(found))

#extracting experience
def extract_experience(text):
    import re

    # match formats like "Jul 2019 – Jul 2022" or "Jun 2024 – Present"
    matches = re.findall(
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(20\d{2})\s*[-–]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(20\d{2}|present)',
        text.lower()
    )

    total_years = 0

    for _, start_year, _, end_year in matches:
        start = int(start_year)

        if end_year == "present":
            end = 2025   # current year
        else:
            end = int(end_year)

        diff = end - start
        if diff > 0:
            total_years += diff

    # classification
    if total_years == 0:
        return "fresher"
    elif total_years <= 1:
        return "junior"
    elif total_years <= 3:
        return "mid"
    elif total_years <= 5:
        return "experienced"
    else:
        return "senior"
#test
if __name__ == "__main__":
    resume_path = "resume/sample_resume4.pdf" # put a test resume here
    text = extract_text_from_resume(resume_path)


    skills = extract_skills(text)
    experience = extract_experience(text)

    print("Detected Skills:", skills)
    print("Experience Level:", experience)