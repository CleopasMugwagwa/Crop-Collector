FORCE COLLECTOR FORM v840

This is a hard override applied after all app scripts.

Fixes:
- Start Survey section empty.
- Form not opening.
- Second Plot / Offline Sync showing while form is missing.
- Old patch scripts/cache hiding the real crop form.

Expected:
1. Survey Name
2. Crop Survey / Livestock Survey
3. Click Crop Survey
4. Full original form fields display
5. Save Entry at bottom

Install:
1. Copy WELCOME.html into frontend folder.
2. Replace old WELCOME.html.
3. Stop Live Server and start again.
4. Open exactly:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=840
5. Press Ctrl+F5.
6. If still old: DevTools > Application > Storage > Clear site data.
