// content.js — robust URL‑change detection & recording, GeoJSON LineString export
console.log("[SV‑Rec] content script loaded on", location.href);

let recording = false;
let coords = [];
let lastHref = location.href;
let lastCoord = null;

function extractCoords(url) {
  const m = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
}

function recordCurrentCoord() {
  const coord = extractCoords(location.href);
  if (!coord) return;
  if (
    !lastCoord ||
    coord.lat !== lastCoord.lat ||
    coord.lng !== lastCoord.lng
  ) {
    lastCoord = coord;
    if (recording) {
      coords.push(coord);
      console.debug("[SV‑Rec] recorded", coord);
    }
  }
}

// catch SPA navs
["pushState", "replaceState"].forEach((fn) => {
  const orig = history[fn];
  history[fn] = function () {
    const ret = orig.apply(this, arguments);
    setTimeout(recordCurrentCoord, 0);
    return ret;
  };
});
window.addEventListener("popstate", recordCurrentCoord);
window.addEventListener("hashchange", recordCurrentCoord);

// fallback poll
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    recordCurrentCoord();
  }
}, 1000);

recordCurrentCoord();

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "start") {
    recording = true;
    coords = [];
    recordCurrentCoord();
    console.log("[SV‑Rec] START — first point", lastCoord);
    sendResponse({ status: "started" });
  } else if (msg.type === "stop") {
    recording = false;
    console.log("[SV‑Rec] STOP — total points", coords.length);

    // Build LineString GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { count: coords.length },
          geometry: {
            type: "LineString",
            coordinates: coords.map((c) => [c.lng, c.lat]),
          },
        },
      ],
    };

    // auto‑generate filename
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const y = now.getFullYear();
    const M = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const filename = `google-street-path-${y}${M}${d}-${h}${m}${s}.geojson`;

    // download via blob URL
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/vnd.geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();

    sendResponse({ status: "stopped" });
  } else if (msg.type === "getState") {
    sendResponse({ recording, count: coords.length });
  }
  return true;
});
