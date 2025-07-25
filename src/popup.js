// popup.js

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

function withActiveTab(fn) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) fn(tabs[0]);
  });
}

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
      document.body.innerHTML = `<p>⚠️ Please open a Google Maps Street View page first.</p>`;
      return;
    }

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
    chrome.tabs.sendMessage(tab.id, { type: "stop" }, () => {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  });
});
