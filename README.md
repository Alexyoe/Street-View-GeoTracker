# Street View Tracker

A lightweight Chrome extension that records your Google Maps Street View trajectory as a GeoJSON file and lets you download it with one click. No background service workers, no extra permissions, just pop open the popup, hit **Start Recording**, roam around Street View, then **Stop & Save** to get a timestamped `google-street-path-YYYYMMDD-HHMMSS.geojson` file.

---

## 🚀 Features

- **Record in-page**: all recording logic lives in the content script—never sleeps, never loses state.  
- **GeoJSON export**: outputs your path as a GeoJSON file containing a `LineString` and individual coordinate points.  
- **Auto‑naming**: saved files are named `google-street-path-<timestamp>.geojson`.  
- **Zero config**: no filename inputs, no storage permissions, no background workers.  

---

## 📦 Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/alexyoe/street-view-tracker.git
   cd street-view-tracker
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Build**  
   ```bash
   npm run build
   ```
   This produces a `dist/` folder containing your manifest, scripts, popup, and assets.

4. **Load in Chrome**  
   - Open `chrome://extensions`  
   - Enable **Developer mode**  
   - Click **Load unpacked** and select the `dist/` folder  

5. **Enjoy**  
   - Navigate to any Google Maps Street View panorama  
   - Click the **Street View Tracker** toolbar icon  
   - Hit **Start Recording**, explore, then **Stop & Save**  
   - Your `.geojson` will download automatically!

---

## 🗂 Directory Structure

```
street-view-tracker/
├─ assets/
│  ├─ icon16.png
│  ├─ icon48.png
│  └─ icon128.png
├─ src/
│  ├─ content.js       # In-page recording + download logic
│  ├─ popup.html       # Dark-mode popup template
│  └─ popup.js         # Popup ↔ content-script messaging
├─ manifest.json       # MV3 manifest (no background workers)
├─ webpack.config.js   # Bundles src → dist using Webpack + HTMLPlugin
├─ package.json        # NPM scripts & dependencies
└─ README.md           # ← you are here!
```

---

## 🤝 Contributing

1. Fork the repo  
2. Create a feature branch  
3. Make your changes & test  
4. Submit a Pull Request  

Please keep PRs small and focused. All contributions are welcome!

---

## 📜 License

This project is released under the [MIT License](LICENSE).  
Made with ♥ by [Alexyoe](https://github.com/alexyoe).  
