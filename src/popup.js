// popup.js — make sure this replaces your old version

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const nameIn = document.getElementById("filename");

function withActiveTab(fn) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    fn(tabs[0]);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  withActiveTab((tab) => {
    const url = tab.url || "";
    let isMaps = false;
    try {
      const u = new URL(url);
      // allow either host:
      if (
        (u.host === "www.google.com" && u.pathname.startsWith("/maps")) ||
        u.host === "maps.google.com"
      ) {
        isMaps = true;
      }
    } catch (e) {}

    if (!isMaps) {
      document.body.innerHTML = `
        <p style="font-family:sans-serif; padding:10px;">
          ⚠️ Please open a Google Maps Street View page first.
        </p>`;
      return;
    }

    // we’re on maps, restore the button state
    chrome.tabs.sendMessage(tab.id, { type: "getState" }, (res) => {
      if (!res) return;
      startBtn.disabled = res.recording;
      stopBtn.disabled = !res.recording;
    });
  });
});

startBtn.addEventListener("click", () => {
  withActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "start" }, () => {
      startBtn.disabled = true;
      stopBtn.disabled = false;
    });
  });
});

stopBtn.addEventListener("click", () => {
  withActiveTab((tab) => {
    const fn = nameIn.value.trim() || "coords";
    chrome.tabs.sendMessage(tab.id, { type: "stop", filename: fn }, () => {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  });
});
