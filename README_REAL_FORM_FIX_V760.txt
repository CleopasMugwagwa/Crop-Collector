REAL FORM FIX v760

This patch uses your uploaded WELCOME.html and removes the dependency on the failing old layout patches.

What it fixes:
- Removes the visible runtime error box.
- Removes Quick Menu from the collector display.
- Stops old insertAdjacentElement / HierarchyRequestError patch logic from controlling the form.
- Shows only Survey Name first.
- Adds clean Crop Survey and Livestock Survey buttons.
- After clicking Crop Survey or Livestock Survey, all real form fields display.
- Save Entry appears at the bottom of the real form.
- Entries / Operations / Field Readiness / Offline Save & Sync are hidden from the collector view.
- Offline & Basemaps stays collapsed.

Install:
1. Copy WELCOME.html into your frontend folder and replace the old one.
2. Open WELCOME.html?screen=collector&v=760
3. Press Ctrl + F5.

If old behavior remains:
1. DevTools > Application > Storage > Clear site data.
2. Stop and restart Live Server.
3. Open WELCOME.html?screen=collector&v=760.
