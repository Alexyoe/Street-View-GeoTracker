// content.js — robust URL‑change detection & recording

console.log("[SV‑Rec] content script loaded on", location.href);

let recording = false;
let coords = [];
let lastHref = location.href;
let lastCoord = null;

// 1) Extract lat/lng from URLs like ".../@37.86926,-122.25515,3a..."
function extractCoords(url) {
  const m = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
}

// 2) Called whenever the URL might have changed
function recordCurrentCoord() {
  const coord = extractCoords(location.href);
  if (!coord) return;
  // only record if it's different from last
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

// 3) Monkey‑patch History API methods
["pushState", "replaceState"].forEach((fn) => {
  const orig = history[fn];
  history[fn] = function () {
    const ret = orig.apply(this, arguments);
    // let the URL actually update first
    setTimeout(recordCurrentCoord, 0);
    return ret;
  };
});

// 4) Listen to popstate & hashchange
window.addEventListener("popstate", recordCurrentCoord);
window.addEventListener("hashchange", recordCurrentCoord);

// 5) Fallback polling every 1 second
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    recordCurrentCoord();
  }
}, 1000);

// 6) Grab an initial coord if you're already in SV
recordCurrentCoord();

// 7) Handle messages from popup.js
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "start") {
    recording = true;
    coords = [];
    // immediately record the current pano
    recordCurrentCoord();
    console.log("[SV‑Rec] START — first point", lastCoord);
    sendResponse({ status: "started" });
  } else if (msg.type === "stop") {
    recording = false;
    console.log("[SV‑Rec] STOP — total points", coords.length);

    // build GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: coords.map((c, i) => ({
        type: "Feature",
        properties: { index: i + 1 },
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      })),
    };

    // data URI + single download trigger
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/vnd.geo+json",
    });
    const url = URL.createObjectURL(blob);
    const filename =
      (msg.filename || "coords").replace(/\.geojson$/i, "") + ".geojson";

    // create an <a> so Chrome will download it
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
