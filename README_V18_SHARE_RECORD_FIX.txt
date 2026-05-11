Titan V18 - Share Screen Recording Fix + Extra Ideas

What changed:
1) Fixed class recording when screen share is active.
   - The recorder now uses the real getDisplayMedia video track directly instead of drawing the preview video into a canvas.
   - This fixes the common issue where screen share video freezes while audio continues.
2) Added missing reconnectStudentsForShare wrapper.
   - Screen share on/off now forces a clean ICE restart for students.
3) Improved recording MIME and bitrate.
4) Updated service-worker cache name so GitHub Pages/PWA does not keep old JS files.

Upload:
- Upload all files to GitHub repository root.
- Make sure assets/js/admin.js replaces the old file.
- Keep assets/css and assets/js folders exactly as included.
- After upload, open the site and hard refresh: Ctrl+F5.
- If the old version still appears, unregister the service worker from browser DevTools > Application > Service Workers.

Firebase Rules:
- Use firebase_database_rules_saas_v16_features_pack.json in Firebase Console > Realtime Database > Rules.
- Do not upload it as a web page.
