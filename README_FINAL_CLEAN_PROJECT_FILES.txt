FINAL CLEAN PROJECT FILES v400

This is a cleaner final package.

Files included:
- WELCOME.html
- collector-final-fixes.css
- collector-final-fixes.js
- admin-dashboard.html
- admin-final-fixes.css
- admin-final-fixes.js
- favicon.svg
- favicon.ico
- manifest.json

What is fixed:
- Removed missing collector-final-layout.css/js references causing 404.
- Welcome buttons are visible and clickable.
- Collector map is larger on phone/tablet.
- Drawing polygons/markers/edit/delete opens fullscreen map on phone/tablet.
- Start Crop and Start Livestock display as full-width block buttons.
- Admin dashboard card fonts are smaller and no longer break into huge stacked text.
- Old bottom navigation overlay is removed.
- Debug console messages are suppressed.
- Field questions are unchanged.

Install:
1. Backup your current frontend folder.
2. Copy all files in this ZIP into the same folder where WELCOME.html is located.
3. Replace existing WELCOME.html and admin-dashboard.html.
4. Restart Live Server.
5. Open:
   WELCOME.html?screen=login&v=400
   WELCOME.html?screen=collector&v=400
   admin-dashboard.html?v=400
6. Press Ctrl + F5.

Important:
If you still see old styles, clear browser cache for localhost or open an incognito window.
