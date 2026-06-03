GEOMETRY CAPTURE FIX v650

Problem seen from your API output:
- Records are approved.
- But geometry is null.
- field_entries insert failed because geometry is NOT NULL.
- Shapefile export fails because there is no approved record with geometry.

Fix:
1. Adds geometry-capture-fix.js.
2. Captures Leaflet.draw geometry when the officer draws a polygon/point.
3. Stores the drawn geometry in window.currentGeometry and localStorage.
4. offline-sync-engine.js now saves that geometry into the synced record.
5. If real polygon geometry is not found, it falls back to a Point from location_name such as:
   Polygon center (-17.869187, 31.274107)

Install:
1. Copy all files into your frontend folder.
2. Replace existing files.
3. Open:
   WELCOME.html?screen=collector&v=650
4. Press Ctrl + F5.
5. Draw a NEW polygon/point.
6. Save the record.
7. Sync Now.
8. Approve the new record.
9. Export Shapefile.

Important:
Old records already synced with geometry:null cannot produce shapefiles unless geometry is manually repaired.
Create a fresh record after installing v650.
