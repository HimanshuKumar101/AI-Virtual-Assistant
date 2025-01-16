const API_KEY = "YOUR_API_KEY"; // Access the API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

let btn = document.querySelector("#btn");
let content = document.querySelector("#content");
let voice = document.querySelector("#voice");
let stopBtn = document.querySelector("#stopBtn");

// Speech synthesis object
let currentSpeech = null;

// Check if SpeechRecognition is supported
if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    console.error("SpeechRecognition is not supported in this browser.");
    content.innerText = "SpeechRecognition is not supported in this browser.";
} else {
    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = new SpeechRecognition();

    recognition.continuous = false; // Stop after one result
    recognition.interimResults = false; // Only final results
    recognition.lang = "en-US"; // Set language

    recognition.onstart = () => {
        console.log("Voice recognition started...");
        voice.style.display = "block"; // Show voice animation
        btn.style.display = "none"; // Hide button
    };

    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        console.log("You said:", transcript);
        takeCommand(transcript.toLowerCase());
    };

    recognition.onerror = (event) => {
        console.error("Error occurred in recognition:", event.error);
        resetUI(); // Reset UI on error
    };

    recognition.onend = () => {
        console.log("Voice recognition ended.");
        resetUI(); // Reset UI when recognition ends
    };

    btn.addEventListener("click", () => {
        console.log("Button clicked. Starting recognition...");
        recognition.start();
    });
}

// Stop speech synthesis and reset UI
stopBtn.addEventListener("click", () => {
    if (currentSpeech) {
        window.speechSynthesis.cancel(); // Stop speaking
        console.log("Speech stopped.");
    }
    resetUI(); // Reset UI
});

// Reset UI to initial state
function resetUI() {
    voice.style.display = "none"; // Hide voice animation
    btn.style.display = "flex"; // Show "Click here to talk to me" button
    content.innerText = "Click here to talk to me"; // Reset content text
}

function speak(text) {
    if (currentSpeech) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
    let text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.pitch = 1;
    text_speak.volume = 1;
    text_speak.lang = "en-US"; // Change language if needed
    currentSpeech = text_speak;
    window.speechSynthesis.speak(text_speak);
}

async function takeCommand(message) {
    voice.style.display = "none";
    btn.style.display = "flex";

    if (message.includes("hello") || message.includes("hey")) {
        speak("Hello, how can I help you?");
    } else if (message.includes("who are you")) {
        speak("I am your virtual assistant.");
    } else if (message.includes("open youtube")) {
        speak("Opening YouTube...");
        window.open("https://youtube.com/", "_blank");
    } else if (message.includes("open google")) {
        speak("Opening Google...");
        window.open("https://google.com/", "_blank");
    } else if (message.includes("time")) {
        let time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        speak(`The time is ${time}`);
    } else if (message.includes("date")) {
        let date = new Date().toLocaleString(undefined, { day: "numeric", month: "short" });
        speak(`Today's date is ${date}`);
    } else {
        // Call Gemini API for the response
        const response = await fetchGeminiResponse(message);
        speak(response); // Speak the response
    }
}

async function fetchGeminiResponse(query) {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: query,
                            },
                        ],
                    },
                ],
            }),
        });

        const data = await response.json();
        // Extract the response text and remove all unwanted formatting (e.g., **)
        let responseText = data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/\*/g, ""); // Remove all * characters
        return responseText;
    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        return "Sorry, I couldn't fetch the response. Please try again.";
    }
}
