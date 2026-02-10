import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home"); // "home", "setup", "interview", "contact"
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
  const [volume, setVolume] = useState(0);
  const [messageSent, setMessageSent] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [recordings, setRecordings] = useState({}); // { questionIndex: blob }
  const [currentAudioURL, setCurrentAudioURL] = useState(null);



  // Start camera only in interview stage
  useEffect(() => {
    if (stage === "interview" && currentPage === "setup") {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => alert("Could not access camera"));
    }
  }, [stage, currentPage]);

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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (stage === "interview" && questions.length > 0) {
      speakQuestion(questions[qIndex]);
      setMicOn(false);
      setVolume(0);
    }
  }, [stage, qIndex, questions]);

  const startMic = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setAudioStream(stream);
    setMicOn(true);

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });

      // Save per question
      setRecordings((prev) => ({
        ...prev,
        [qIndex]: blob,
      }));

      // For demo playback
      const url = URL.createObjectURL(blob);
      setCurrentAudioURL(url);
    };

    mediaRecorder.start(); // 🎤 START RECORDING NOW

    // --------- Volume Meter (your existing code) ----------
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const level = Math.min(rms * 400, 255);
      setVolume(level);
      requestAnimationFrame(updateVolume);
    };

    updateVolume();
  } catch (err) {
    console.error("Mic error:", err);
    alert("Could not access microphone");
  }
};

  const stopRecording = () => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
    mediaRecorderRef.current.stop();
  }

  if (audioStream) {
    audioStream.getTracks().forEach((t) => t.stop());
  }

  setMicOn(false);
};




  // -------- Test Record (5 sec) --------
  


  // -------- HOME PAGE --------
  if (currentPage === "home") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage("home")} className="nav-link active">
                Home
              </button>
              <button onClick={() => setCurrentPage("setup")} className="nav-link">
                Interview
              </button>
              <button onClick={() => setCurrentPage("contact")} className="nav-link">
                Contact
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="page-container">
            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-content">
                <h1 className="hero-title">
                  Ace Your Next Interview with AI
                </h1>
                <p className="hero-subtitle">
                  Transform your interview preparation with our cutting-edge AI platform. 
                  Upload your resume, get personalized questions, and practice with real-time 
                  video and audio feedback.
                </p>
                <button
                  className="cta-button"
                  onClick={() => setCurrentPage("setup")}
                >
                  Start Interview Prep →
                </button>
              </div>

              <div className="hero-visual">
                <div className="floating-card" style={{top: '10px', left: '80px'}}>
                  <span className="card-icon">📄</span>
                  <span> Upload Resume</span>
                </div>
                <div className="floating-card" style={{top: '150px', right: '90px'}}>
                  <span className="card-icon">🤖</span>
                  <span>AI Analysis</span>
                </div>
                <div className="floating-card" style={{bottom: '10px', left: '80px'}}>
                  <span className="card-icon">🎯</span>
                  <span>Get Hired</span>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
              <h2 className="section-title">How It Works</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📄</div>
                  <h3>Upload Resume</h3>
                  <p>Simply upload your PDF resume and our AI will analyze your skills, experience, and background</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🤖</div>
                  <h3>AI Question Generation</h3>
                  <p>Get personalized interview questions tailored to your profile and experience level</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎥</div>
                  <h3>Live Practice</h3>
                  <p>Practice with video and audio recording in a realistic interview environment</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Detailed Feedback</h3>
                  <p>Receive comprehensive evaluation and insights to improve your performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
        </div>
      </div>
    );
  }

  // -------- CONTACT PAGE --------
  if (currentPage === "contact") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage("home")} className="nav-link">
                Home
              </button>
              <button onClick={() => setCurrentPage("setup")} className="nav-link">
                Interview
              </button>
              <button onClick={() => setCurrentPage("contact")} className="nav-link active">
                Contact
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="contact-container">
            <h1 className="page-title">Get In Touch</h1>

            <div className="contact-content">
              <div className="contact-info">
                <h2>Contact Information</h2>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div>
                    <h3>Email</h3>
                    <p>support@aiinterviewpro.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🌐</span>
                  <div>
                    <h3>Website</h3>
                    <p>www.aiinterviewpro.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <div>
                    <h3>Location</h3>
                    <p>Serving candidates worldwide</p>
                  </div>
                </div>
              </div>

              <div className="contact-form">
                <h2>Send us a Message</h2>
                <form onSubmit={handleContactSubmit}>

                  <input
                    type="text"
                    placeholder="Your Name"
                    className="form-input"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="form-input"
                  />
                  <textarea
                    rows="5"
                    placeholder="Your Message"
                    className="form-textarea"
                  ></textarea>
                  <button type="submit" className="primary-button">
                    Send Message
                  </button>
                  {messageSent && (
                    <p style={{ color: "green", fontWeight: "600", marginTop: "10px" }}>
                      ✅ Message sent successfully!
                    </p>
                  )}

                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
        </div>
      </div>
    );
  }

  // -------- SETUP PAGE --------
  if (stage === "setup") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage("home")} className="nav-link">
                Home
              </button>
              <button onClick={() => setCurrentPage("setup")} className="nav-link active">
                Interview
              </button>
              <button onClick={() => setCurrentPage("contact")} className="nav-link">
                Contact
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="setup-container">
            <h1 className="page-title">Setup Your Interview</h1>

            <div className="setup-card">
              {/* Step 1: Upload Resume */}
              <div className="setup-step">
                <div className="step-header">
                  <span className="step-number">1</span>
                  <h2>Upload Your Resume</h2>
                </div>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept=".pdf"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    {file ? (
                      <>
                        <span className="file-icon">✓</span>
                        <span>{file.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="upload-icon">📄</span>
                        <span>Click to upload PDF resume</span>
                      </>
                    )}
                  </label>
                </div>
                <button
                  onClick={uploadResume}
                  className="primary-button"
                  disabled={!file}
                >
                  Analyze Resume
                </button>
              </div>

              {/* Step 2: Skills & Experience */}
              {skills.length > 0 && (
                <div className="setup-step">
                  <div className="step-header">
                    <span className="step-number">2</span>
                    <h2>Review Your Profile</h2>
                  </div>

                  <div className="skills-section">
                    <h3 style={{marginBottom: '1rem', color: '#2d3748'}}>Extracted Skills</h3>
                    <div className="skills-container">
                      {skills.map((s, i) => (
                        <span key={i} className="skill-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="experience-selector">
                    <label>Experience Level</label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="select-input"
                    >
                      <option value="fresher">Fresher</option>
                      <option value="junior">Junior (1-2 years)</option>
                      <option value="mid">Mid-level (3-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  <button onClick={generateQuestions} className="primary-button">
                    Generate Questions
                  </button>
                </div>
              )}

              {/* Step 3: Questions Preview */}
              {questions.length > 0 && (
                <div className="setup-step">
                  <div className="step-header">
                    <span className="step-number">3</span>
                    <h2>Your Interview Questions</h2>
                  </div>

                  <div className="questions-list">
                    {questions.map((q, i) => (
                      <div key={i} className="question-item">
                        <span className="question-number">Q{i + 1}</span>
                        <p>{q}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setStage("interview")}
                    className="primary-button"
                    style={{fontSize: '1.1rem', padding: '1.25rem 2rem'}}
                  >
                    🎤 Start Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
        </div>
      </div>
    );
  }

  // -------- INTERVIEW SCREEN --------
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🤖</span>
            AI Interview Pro
          </div>
          <div className="nav-links">
            <span className="recording-indicator">● LIVE</span>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="interview-container">
          <div className="interview-header">
            <h1>Live Interview Session</h1>
            <p className="interview-progress">
              Question {qIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="interview-content">
            {/* Video Section */}
            <div className="video-section">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="video-feed"
              />
              <div className="video-overlay">
                <span className="recording-indicator">● REC</span>
              </div>
            </div>

            {/* Interview Panel */}
            <div className="interview-panel">
              <div className="question-card">
                <h3>Current Question</h3>
                <p className="question-text">{questions[qIndex]}</p>
              </div>

              <div className="controls-section">
              {!micOn ? (
                <>
                  <button onClick={startMic} className="mic-button start">
                    <span className="mic-icon">🎙️</span>
                    Start Answer
                  </button>

                  {recordings[qIndex] && (
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(recordings[qIndex]);
                        const audio = new Audio(url);
                        audio.play();
                      }}
                      className="secondary-button"
                      style={{ marginTop: "1rem" }}
                    >
                      🎧 Play Your Answer
                    </button>
                  )}
                </>
              ) : (
                <div className="mic-active">
                  <div className="mic-status">
                    <span className="pulse-dot"></span>
                    <span>Recording your answer...</span>
                  </div>

                  <button onClick={stopRecording} className="secondary-button">
                    ⏹ Stop Recording
                  </button>
                </div>
              )}
            </div>


              <div className="navigation-buttons">
                <button
                  onClick={() => {
                    stopRecording();
                    setQIndex((i) => Math.max(i - 1, 0));
                  }}
                  disabled={qIndex === 0}
                  className="nav-button"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => {
                    stopRecording();
                    setQIndex((i) => Math.min(i + 1, questions.length - 1));
                  }}
                  disabled={qIndex === questions.length - 1}
                  className="nav-button primary"
                >
                  Next →
                </button>

              </div>

              {qIndex === questions.length - 1 && (
                <button className="finish-button">
                  Finish Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
      </div>
    </div>
  );
}

export default App;

