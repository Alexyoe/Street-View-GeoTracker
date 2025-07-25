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

// Swap toolbar icon
function setExtensionIcon(recording) {
  const path = recording
    ? {
        16: "assets/16-active.png",
        48: "assets/48-active.png",
        128: "assets/128-active.png",
      }
    : {
        16: "assets/16.png",
        48: "assets/48.png",
        128: "assets/128.png",
      };
  chrome.action.setIcon({ path });
}

// Enable/disable + label + icon in one place
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
  setExtensionIcon(recording);
}

// On popup open, guard URLs & restore state+UI
window.addEventListener("DOMContentLoaded", () => {
  withActiveTab((tab) => {
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

    // ask content.js if we’re already recording
    chrome.tabs.sendMessage(tab.id, { type: "getState" }, (res) => {
      if (res && typeof res.recording === "boolean") {
        updateButtons(res.recording);
      }
    });
  });
});

// Single Start handler
startBtn.addEventListener("click", () => {
  withActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "start" }, () => {
      updateButtons(true);
    });
  });
});

// Single Stop handler
stopBtn.addEventListener("click", () => {
  withActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "stop" }, () => {
      updateButtons(false);
    });
  });
});
