BALANCED FINAL FRONTEND v820

This is the combined final version using the fixes discussed, without breaking the core app.

Included fixes:
- Keeps the real form and restores it after choosing Crop Survey / Livestock Survey.
- Removes the conflicting patch scripts that were hiding the form.
- Keeps core app scripts: map, sync, backend, geometry capture, second plot helper.
- Clean collector layout.
- Desktop: map left, form right.
- Mobile/tablet: large map on top, form below.
- Quick Menu hidden because it was overcrowding the collector.
- Entries, Operations, Field Readiness, Offline Save & Sync hidden from the normal collector screen.
- Offline & Basemaps remains available but collapsed.
- Login buttons polished.
- Runtime error boxes hidden.
- Save Entry remains at the bottom of the real form.

Install:
1. Copy WELCOME.html into your frontend folder and replace the current one.
2. Open WELCOME.html?screen=collector&v=820
3. Press Ctrl + F5.
4. Clear site data once if the old UI still appears:
   DevTools > Application > Storage > Clear site data
5. Restart Live Server.

Expected workflow:
1. Survey Name
2. Crop Survey / Livestock Survey
3. Real form opens:
   Farmer / Owner Name, Farm Name, Sector, Crop Type, Growth Stage, etc.
4. Draw polygon/point.
5. Save Entry.
