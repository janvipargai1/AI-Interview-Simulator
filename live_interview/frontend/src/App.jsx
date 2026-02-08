import { useEffect, useRef, useState } from "react";

function App() {
  const [stage, setStage] = useState("setup"); // "setup" or "interview"

  // Setup states
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState("fresher");
  const [questions, setQuestions] = useState([]);

  // Interview states
  const videoRef = useRef(null);
  const [qIndex, setQIndex] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [volume, setVolume] = useState(0); // mic level meter

  // Start camera only in interview stage (NO MIC)
  useEffect(() => {
    if (stage === "interview") {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => alert("Could not access camera"));
    }
  }, [stage]);

  // -------- API Calls --------

  const uploadResume = async () => {
    if (!file) {
      alert("Please select a PDF resume first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/upload_resume", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSkills(data.skills || []);
    setExperience(data.experience || "fresher");
  };

  const generateQuestions = async () => {
    const res = await fetch("http://localhost:8000/generate_questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: skills,
        experience: experience,
      }),
    });

    const data = await res.json();
    setQuestions(data.questions || []);
  };

  // -------- TTS (Speak Question) --------
  const speakQuestion = (text) => {
    window.speechSynthesis.cancel(); // stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (stage === "interview" && questions.length > 0) {
      speakQuestion(questions[qIndex]);
      setMicOn(false); // turn mic off when new question starts
      setVolume(0);
    }
  }, [stage, qIndex, questions]);

  // -------- Mic Control + Volume Meter --------
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setMicOn(true);

      // Setup volume meter
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setVolume(avg); // roughly 0–255
        requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      alert("Could not access microphone");
    }
  };

  // -------- Test Record (5 sec) --------
  const testRecord = () => {
    if (!audioStream) {
      alert("Mic not started!");
      return;
    }

    const mediaRecorder = new MediaRecorder(audioStream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play(); // 🔊 Play your recorded voice
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // record 5 seconds
  };

  // -------- UI --------

  if (stage === "setup") {
    return (
      <div style={{ padding: 20 }}>
        <h2>🤖 AI Interview Simulator</h2>

        <h3>1️⃣ Upload Resume</h3>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />
        <button onClick={uploadResume}>Analyze Resume</button>

        {skills.length > 0 && (
          <>
            <hr />
            <h3>2️⃣ Extracted Skills</h3>
            <ul>
              {skills.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            <h3>Experience</h3>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="fresher">fresher</option>
              <option value="junior">junior</option>
              <option value="mid">mid</option>
              <option value="senior">senior</option>
            </select>

            <br /><br />
            <button onClick={generateQuestions}>Generate Questions</button>
          </>
        )}

        {questions.length > 0 && (
          <>
            <hr />
            <h3>3️⃣ Generated Questions</h3>
            <ol>
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>

            <br />
            <button onClick={() => setStage("interview")}>
              🎤 Start Interview
            </button>
          </>
        )}
      </div>
    );
  }

  // -------- INTERVIEW SCREEN --------

  return (
    <div style={{ padding: 20 }}>
      <h2>🎥 Live Interview</h2>

      <video ref={videoRef} autoPlay playsInline width="400" />

      <hr />

      {questions.length > 0 && (
        <>
          <h3>Question {qIndex + 1}:</h3>
          <p>{questions[qIndex]}</p>

          {!micOn ? (
            <button onClick={startMic}>🎙️ Start Answer</button>
          ) : (
            <>
              <p>🎤 Mic is ON. You can answer now.</p>

              {/* Volume Meter */}
              <div style={{ marginBottom: "10px" }}>
                <p>Mic Level:</p>
                <div style={{ width: "200px", height: "10px", border: "1px solid #000" }}>
                  <div
                    style={{
                      width: `${Math.min(volume, 200)}px`,
                      height: "10px",
                      background: "green",
                    }}
                  />
                </div>
              </div>

              <button onClick={testRecord}>🎧 Test Record (5 sec)</button>
            </>
          )}

          <br /><br />

          <button
            onClick={() => setQIndex((i) => Math.min(i + 1, questions.length - 1))}
          >
            Next Question
          </button>
        </>
      )}
    </div>
  );
}

export default App;