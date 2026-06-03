COLLECTOR RUNTIME + CLEAN LAYOUT FIX v690

Fixes:
- Runtime issue: Cannot set properties of null (setting 'innerHTML')
- Restores Crop Survey and Livestock Survey buttons.
- Stops helper/status text from crowding the app.
- Keeps Offline & Basemaps collapsed until clicked.
- Hides Settings, Operations and Field Readiness from normal collector display.
- Keeps actual form questions, Back/Next, Save, map and drawing tools.

Install:
1. Copy ALL files into the frontend folder, especially:
   WELCOME.html
   collector-runtime-layout-fix.js
   collector-final-fixes.css
   collector-final-layout.css
   collector.css
   collector-final-fixes.js
   collector-final-layout.js
2. Replace existing files.
3. Open:
   WELCOME.html?screen=collector&v=690
4. Press Ctrl + F5.

If app still shows old behavior:
- Clear site data in Chrome DevTools > Application > Storage > Clear site data.
- Restart Live Server.
