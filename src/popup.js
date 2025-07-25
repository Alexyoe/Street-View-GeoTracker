// popup.js

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const controlDiv = document.getElementById("controls");

// Helper to query the active tab
function withActiveTab(fn) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) fn(tabs[0]);
  });
}

// Centralize enabling/disabling + label updates
function updateButtons(recording) {
  if (recording) {
    startBtn.textContent = "Recording…";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    startBtn.textContent = "Start Recording";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// On popup open, check if we're on Street View & restore state
window.addEventListener("DOMContentLoaded", () => {
  withActiveTab((tab) => {
    // Only show controls on a Maps URL
    let isMaps = false;
    try {
      const u = new URL(tab.url);
      isMaps =
        (u.host === "www.google.com" && u.pathname.startsWith("/maps")) ||
        u.host === "maps.google.com";
    } catch {}

    if (!isMaps) {
      controlDiv.innerHTML = `
        <div class="warning">
          <p>⚠️ Please open a Google Maps Street View page first.</p>
        </div>`;
      return;
    }

    // Restore recording state
    chrome.tabs.sendMessage(tab.id, { type: "getState" }, (res) => {
      if (res && typeof res.recording === "boolean") {
        updateButtons(res.recording);
      }
    });
  });
});

// Start click → tell content.js and flip UI
startBtn.addEventListener("click", () => {
  withActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "start" }, () => {
      updateButtons(true);
    });
  });
});

// Stop click → tell content.js and flip UI
stopBtn.addEventListener("click", () => {
  withActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "stop" }, () => {
      updateButtons(false);
    });
  });
});
