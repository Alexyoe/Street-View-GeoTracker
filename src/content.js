// content.js — robust URL-change detection & recording, GeoJSON LineString export

console.log("[SV-Rec] content script loaded on", location.href);

let recording = false;
let coords = [];
let lastHref = location.href;
let lastCoord = null;

// 1) Extract lat/lng from URLs like ".../@37.86926,-122.25515,3a..."
function extractCoords(url) {
  const m = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
}

// 2) Record a new coord if URL has changed and recording is active
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
      console.debug("[SV-Rec] recorded", coord);
    }
  }
}

// 3) Monkey-patch History API to catch SPA navigations
["pushState", "replaceState"].forEach((fn) => {
  const orig = history[fn];
  history[fn] = function () {
    const ret = orig.apply(this, arguments);
    // schedule after URL actually changes
    setTimeout(recordCurrentCoord, 0);
    return ret;
  };
});
window.addEventListener("popstate", recordCurrentCoord);
window.addEventListener("hashchange", recordCurrentCoord);

// 4) Fallback polling every second in case of other changes
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    recordCurrentCoord();
  }
}, 1000);

// 5) Initial check on script load
recordCurrentCoord();

// 6) Handle messages from popup.js
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "start") {
    recording = true;
    coords = [];
    // immediately record the current location
    recordCurrentCoord();
    console.log("[SV-Rec] START — first point", lastCoord);
    sendResponse({ status: "started" });
  } else if (msg.type === "stop") {
    recording = false;
    console.log("[SV-Rec] STOP — total points", coords.length);

    // Build a single LineString feature
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

    // Create a Blob and download it
    const dataStr = JSON.stringify(geojson, null, 2);
    const blob = new Blob([dataStr], { type: "application/vnd.geo+json" });
    const url = URL.createObjectURL(blob);
    const filename =
      (msg.filename || "path").replace(/\.geojson$/i, "") + ".geojson";

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
