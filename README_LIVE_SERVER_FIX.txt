Titan Academy - Live Server Safe Final Fix

What was fixed:
- Removed raw </body> and </html> strings from JavaScript print/certificate builders.
- VS Code Live Server injects its reload script before </body>; if this text appears inside JavaScript strings, it corrupts the script and causes errors like login is not defined.
- Bumped service-worker cache name to avoid old cached files.

Upload/replace all files in the repository root.
Open admin as: admin.html?tenant=titan
If testing locally, use: http://127.0.0.1:5500/admin.html?tenant=titan

After replacing files:
1) Ctrl + F5
2) If old files still load: DevTools > Application > Service Workers > Unregister
3) Then refresh again.
