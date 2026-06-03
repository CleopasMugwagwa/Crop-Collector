FINAL FORM DISPLAY FIX v750

This fixes the actual issue in your uploaded WELCOME.html:
- Quick Menu was blocking/standing in front of the app.
- The real form fields existed in the HTML but were hidden by later layout patches.
- Save buttons/status cards were appearing before the form.

Expected workflow:
1. Survey Name
2. Crop Survey / Livestock Survey
3. Actual form fields display
4. Save Entry appears at the bottom of the real form

Install:
1. Copy WELCOME.html into your frontend folder and replace the old WELCOME.html.
2. Also copy final-form-fix-v750.css and final-form-fix-v750.js if you want the patch files kept separately.
3. Open: WELCOME.html?screen=collector&v=750
4. Press Ctrl + F5.

If old behaviour remains:
DevTools > Application > Storage > Clear site data
Then restart Live Server.
