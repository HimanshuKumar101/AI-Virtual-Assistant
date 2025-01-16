const BACKEND_URL = "https://ai-virtual-voice-assistant-backend.vercel.app/"; 
const messages = [];
let isListening = false;
let isSpeaking = false;
let recognition;

// DOM Elements
const messagesContainer = document.getElementById("messages");
const inputText = document.getElementById("inputText");
const toggleListeningBtn = document.getElementById("toggleListening");
const stopSpeakingBtn = document.getElementById("stopSpeaking");
const clearChatBtn = document.getElementById("clearChat");
const chatForm = document.getElementById("chatForm");

// Check if SpeechRecognition is supported
if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
  alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
} else {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    handleUserInput(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    alert("An error occurred with speech recognition. Please try again.");
    isListening = false;
    updateMicButton();
  };

  recognition.onend = () => {
    isListening = false;
    updateMicButton();
  };
}

// Handle User Input
async function handleUserInput(text) {
  const userMessage = {
    text,
    sender: "user",
    timestamp: new Date(),
  };
  addMessage(userMessage);

  // Process the command and get response from the backend
  const response = await processCommand(text.toLowerCase());

  const assistantMessage = {
    text: response,
    sender: "assistant",
    timestamp: new Date(),
  };
  addMessage(assistantMessage);
  speak(response);
}

// Process Command with Backend
async function processCommand(text) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    return data.response; // Return the response from the backend
  } catch (error) {
    console.error("Error fetching response from backend:", error);
    return "Sorry, I couldn't fetch the response. Please try again.";
  }
}

// Add Message to Chat
function addMessage(message) {
  messages.push(message);
  renderMessages();
  scrollToBottom();
}

// Render Messages
function renderMessages() {
  messagesContainer.innerHTML = messages
    .map(
      (message) => `
        <div class="message ${message.sender}">
          ${message.sender === "assistant" ? '<i data-lucide="bot" class="w-8 h-8 text-cyan-400 mt-1"></i>' : ""}
          <div class="message-bubble">
            <p>${message.text}</p>
            <span class="message-timestamp">${message.timestamp.toLocaleTimeString()}</span>
          </div>
          ${message.sender === "user" ? '<i data-lucide="user" class="w-8 h-8 text-pink-400 mt-1"></i>' : ""}
        </div>
      `
    )
    .join("");
  lucide.createIcons(); // Refresh icons
}

// Scroll to Bottom
function scrollToBottom() {
  const messagesEnd = document.getElementById("messagesEnd");
  messagesEnd.scrollIntoView({ behavior: "smooth" });
}

// Speak Text
function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-US";

    utterance.onstart = () => {
      isSpeaking = true;
      updateVolumeButton();
    };

    utterance.onend = () => {
      isSpeaking = false;
      updateVolumeButton();
    };

    window.speechSynthesis.speak(utterance);
  }
}

// Toggle Listening
function toggleListening() {
  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
    isListening = true;
  }
  updateMicButton();
}

// Stop Speaking
function stopSpeaking() {
  window.speechSynthesis.cancel();
  isSpeaking = false;
  updateVolumeButton();
}

// Update Mic Button
function updateMicButton() {
  const micIcon = toggleListeningBtn.querySelector("i");
  if (isListening) {
    micIcon.setAttribute("data-lucide", "mic-off");
  } else {
    micIcon.setAttribute("data-lucide", "mic");
  }
  lucide.createIcons();
}

// Update Volume Button
function updateVolumeButton() {
  const volumeIcon = stopSpeakingBtn.querySelector("i");
  if (isSpeaking) {
    volumeIcon.setAttribute("data-lucide", "volume-2");
  } else {
    volumeIcon.setAttribute("data-lucide", "volume-x");
  }
  lucide.createIcons();
}

// Clear Chat
function clearChat() {
  messages.length = 0;
  renderMessages();
}

// Event Listeners
toggleListeningBtn.addEventListener("click", toggleListening);
stopSpeakingBtn.addEventListener("click", stopSpeaking);
clearChatBtn.addEventListener("click", clearChat);
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (inputText.value.trim()) {
    handleUserInput(inputText.value);
    inputText.value = "";
  }
});
