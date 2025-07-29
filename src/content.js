// content.js — robust URL‑change detection & recording, GeoJSON LineString export
console.log("[SVGT] content script loaded on", location.href);

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
      console.debug("[SVGT] recorded", coord);
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
    console.log("[SVGT] START — first point", lastCoord);
    sendResponse({ status: "started" });
  } else if (msg.type === "stop") {
    recording = false;
    console.log("[SVGT] STOP — total points", coords.length);

    // 1) Build a combined features array
    const features = [];

    // 1a) The LineString feature (the path)
    features.push({
      type: "Feature",
      properties: { featureType: "path", count: coords.length },
      geometry: {
        type: "LineString",
        coordinates: coords.map((c) => [c.lng, c.lat]),
      },
    });

    // 1b) Individual Point features
    coords.forEach((c, i) => {
      features.push({
        type: "Feature",
        properties: { featureType: "point", index: i + 1 },
        geometry: {
          type: "Point",
          coordinates: [c.lng, c.lat],
        },
      });
    });

    // 2) Wrap into a FeatureCollection
    const geojson = {
      type: "FeatureCollection",
      features,
    };

    // 3) Auto‑generate filename
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const ts = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      "-",
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join("");
    const filename = `google-street-path-${ts}.geojson`;

    // 4) Trigger download via Blob
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
