import re

FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically",
    "actually", "so", "right", "i mean"
]

def analyze_voice(text):

    text_lower = text.lower()

    words = re.findall(r'\b\w+\b', text_lower)
    word_count = len(words)

    filler_count = 0
    fillers_found = []

    for filler in FILLER_WORDS:
        count = text_lower.count(filler)
        if count > 0:
            filler_count += count
            fillers_found.append((filler, count))

    filler_ratio = filler_count / word_count if word_count > 0 else 0

    # confidence score logic
    if filler_ratio < 0.02:
        confidence = "High"
    elif filler_ratio < 0.05:
        confidence = "Medium"
    else:
        confidence = "Low"

    return {
        "word_count": word_count,
        "filler_word_count": filler_count,
        "fillers_used": fillers_found,
        "confidence_level": confidence
    }