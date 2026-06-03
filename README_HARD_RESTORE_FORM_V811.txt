HARD RESTORE FORM v811

This fixes the v810 failure:
- TypeError: select.options is not iterable
- Crop/Livestock not opening the form

Cause:
app-db.js expects #survey-name to be a SELECT element and reads select.options.
v810 used an INPUT in the hard restore chooser.

Fixes:
1. #survey-name is now a proper <select>.
2. HTMLOptionsCollection iterator polyfill added before app-db loads.
3. Safe user/startApp guard added.
4. Crop Survey / Livestock buttons have a final repair binding to force the form open.

Install:
1. Copy WELCOME.html into your frontend folder.
2. Replace the current WELCOME.html.
3. Stop Live Server.
4. Start Live Server again.
5. Open exactly:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=811
6. Press Ctrl + F5.
7. If old errors remain, clear site data:
   DevTools > Application > Storage > Clear site data.
