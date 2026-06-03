STABLE SIMPLE COLLECTOR v800

This version removes the conflicting wizard/layout patch scripts that were hiding the real form.

Expected display:
1. Survey Name
2. Crop Survey / Livestock Survey buttons
3. After clicking one, the actual form fields open:
   Farmer / Owner Name, Farm Name, Sector, Crop Type, Growth Stage, etc.
4. Save Entry appears at the bottom of the form.
5. Quick Menu and dashboard-like panels are hidden from the collector view.
6. Offline & Basemaps remains collapsed.

Install:
1. Copy WELCOME.html into the frontend folder.
2. Replace the old WELCOME.html.
3. Open WELCOME.html?screen=collector&v=800
4. Press Ctrl + F5.
5. If old behavior remains: DevTools > Application > Storage > Clear site data, then restart Live Server.
