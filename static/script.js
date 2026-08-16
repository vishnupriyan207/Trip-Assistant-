// ==========================================
// TRIPMATE AI - SCRIPT.JS
// ==========================================

let currentThreadId = localStorage.getItem("travel_thread_id") || null;

let latestAnswerMarkdown = "";

// ==========================================
// QUICK PROMPT
// ==========================================

function setPrompt(text) {
  const input = document.getElementById("userInput");

  input.value = text;

  input.focus();
}

// ==========================================
// LOADING STATE
// ==========================================

function setLoading(isLoading) {
  const sendBtn = document.getElementById("sendBtn");
  const btnText = document.getElementById("btnText");
  const btnLoader = document.getElementById("btnLoader");

  if (!sendBtn || !btnText || !btnLoader) {
    return;
  }

  sendBtn.disabled = isLoading;

  if (isLoading) {
    btnText.classList.add("hidden");

    btnLoader.classList.remove("hidden");

    sendBtn.setAttribute("aria-label", "Generating travel plan");
  } else {
    btnText.classList.remove("hidden");

    btnLoader.classList.add("hidden");

    sendBtn.setAttribute("aria-label", "Generate travel plan");
  }
}

// ==========================================
// SHOW ERROR
// ==========================================

function showError(message) {
  const errorBox = document.getElementById("errorBox");

  if (!errorBox) {
    return;
  }

  errorBox.textContent = message;

  errorBox.classList.remove("hidden");

  errorBox.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

// ==========================================
// HIDE ERROR
// ==========================================

function hideError() {
  const errorBox = document.getElementById("errorBox");

  if (!errorBox) {
    return;
  }

  errorBox.classList.add("hidden");

  errorBox.textContent = "";
}

// ==========================================
// SHOW RESULT
// ==========================================

function showResult(answer, threadId) {
  latestAnswerMarkdown = answer;

  const resultSection = document.getElementById("resultSection");

  const resultBox = document.getElementById("resultBox");

  const threadInfo = document.getElementById("threadInfo");

  if (!resultSection || !resultBox) {
    return;
  }

  // Render Markdown
  if (typeof marked !== "undefined") {
    resultBox.innerHTML = marked.parse(answer);
  } else {
    resultBox.innerText = answer;
  }

  // Show thread ID
  if (threadInfo) {
    threadInfo.textContent = `Thread ID: ${threadId}`;
  }

  // Show result section
  resultSection.classList.remove("hidden");

  // Smooth scroll to result
  setTimeout(() => {
    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {
  hideError();

  const input = document.getElementById("userInput");

  if (!input) {
    return;
  }

  const message = input.value.trim();

  // Check empty input
  if (!message) {
    showError("Please enter your travel request first.");

    input.focus();

    return;
  }

  // Start loading
  setLoading(true);

  try {
    const response = await fetch("/api/travel", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: message,

        thread_id: currentThreadId,
      }),
    });

    // Try to read JSON response
    let data;

    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error("Invalid response received from server.");
    }

    // Check API response
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to generate your travel plan.");
    }

    // Save thread ID
    currentThreadId = data.thread_id;

    localStorage.setItem("travel_thread_id", currentThreadId);

    // Show result
    showResult(data.answer, data.thread_id);

    // Clear input after successful request
    input.value = "";
  } catch (error) {
    console.error("Travel API Error:", error);

    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

// ==========================================
// COPY RESULT
// ==========================================

function copyResult() {
  const resultBox = document.getElementById("resultBox");

  const copyBtn = document.querySelector(".copy-btn");

  if (!resultBox) {
    return;
  }

  const text = resultBox.innerText.trim();

  if (!text) {
    showError("There is no travel plan to copy.");

    return;
  }

  navigator.clipboard
    .writeText(text)

    .then(() => {
      if (!copyBtn) {
        return;
      }

      const oldText = copyBtn.textContent;

      copyBtn.textContent = "✓ Copied!";

      setTimeout(() => {
        copyBtn.textContent = oldText;
      }, 1500);
    })

    .catch(() => {
      showError("Could not copy the travel plan.");
    });
}

// ==========================================
// DOWNLOAD PDF
// ==========================================

function downloadPDF() {
  const pdfContent = document.getElementById("pdfContent");

  const downloadBtn = document.querySelector(".download-btn");

  if (!latestAnswerMarkdown || !pdfContent) {
    showError("No travel plan available to download.");

    return;
  }

  // Check html2pdf library
  if (typeof html2pdf === "undefined") {
    showError("PDF library is not loaded.");

    return;
  }

  const oldText = downloadBtn ? downloadBtn.textContent : "Download PDF";

  if (downloadBtn) {
    downloadBtn.textContent = "Preparing PDF...";

    downloadBtn.disabled = true;
  }

  const options = {
    margin: 0.5,

    filename: "TripMate-AI-Travel-Plan.pdf",

    image: {
      type: "jpeg",

      quality: 0.98,
    },

    html2canvas: {
      scale: 2,

      useCORS: true,

      backgroundColor: "#ffffff",
    },

    jsPDF: {
      unit: "in",

      format: "a4",

      orientation: "portrait",
    },

    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
    },
  };

  html2pdf()
    .set(options)

    .from(pdfContent)

    .save()

    .then(() => {
      if (downloadBtn) {
        downloadBtn.textContent = "✓ Downloaded";

        setTimeout(() => {
          downloadBtn.textContent = oldText;

          downloadBtn.disabled = false;
        }, 1500);
      }
    })

    .catch((error) => {
      console.error("PDF Error:", error);

      if (downloadBtn) {
        downloadBtn.textContent = oldText;

        downloadBtn.disabled = false;
      }

      showError("Could not download the PDF.");
    });
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener("keydown", function (event) {
  // Ctrl + Enter
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();

    sendMessage();
  }
});

// ==========================================
// ENTER KEY SUPPORT
// ==========================================

document.addEventListener("keydown", function (event) {
  const input = document.getElementById("userInput");

  if (
    document.activeElement === input &&
    event.key === "Enter" &&
    event.ctrlKey
  ) {
    event.preventDefault();

    sendMessage();
  }
});

// ==========================================
// AUTO HIDE ERROR
// ==========================================

document.addEventListener("click", function (event) {
  if (event.target.closest("#userInput")) {
    hideError();
  }
});

// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("✈️ TripMate AI loaded successfully.");

  // Check required libraries
  if (typeof marked === "undefined") {
    console.warn("Marked.js is not loaded.");
  }

  if (typeof html2pdf === "undefined") {
    console.warn("html2pdf.js is not loaded.");
  }
});
