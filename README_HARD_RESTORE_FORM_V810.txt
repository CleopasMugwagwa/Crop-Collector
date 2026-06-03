HARD RESTORE FORM v810

This version is built from your uploaded WELCOME.html and stops the patch conflicts.

What it does:
- Removes the previous experimental patch script references from WELCOME.html.
- Keeps your core app/map/sync scripts.
- Restores a stable Start Survey screen:
  Survey Name
  Crop Survey
  Livestock Survey
- On clicking Crop Survey or Livestock Survey, it restores the actual original form fields:
  Farmer / Owner Name, Farm Name, Sector, Crop Type, Growth Stage, Crop Condition, etc.
- Hides Quick Menu, runtime error boxes, Entries, Operations, Field Readiness, and Offline Save & Sync from the collector display.
- Keeps Offline & Basemaps collapsed.
- Keeps Save Entry at the bottom of the actual form.

Install:
1. Copy WELCOME.html into your frontend folder and replace the current WELCOME.html.
2. Open WELCOME.html?screen=collector&v=810
3. Press Ctrl + F5.
4. If the old UI still appears, clear site data and restart Live Server.
