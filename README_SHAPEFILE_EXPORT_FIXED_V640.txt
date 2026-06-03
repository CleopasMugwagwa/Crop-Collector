SHAPEFILE EXPORT FIX v640

Problem:
- Export Shapefile downloaded approved_shapefile_export_request.json.
- That means the frontend used fallback mode instead of getting a real shapefile ZIP.

Fix:
- Shapefile buttons now call:
  POST http://127.0.0.1:8000/api/v1/exports/shapefile
- If backend succeeds, it downloads:
  approved_records_shapefile.zip
- If backend fails, it shows the real reason.

Important:
The backend exports APPROVED records with geometry only.

Required workflow:
1. Save and sync a record with point/polygon geometry.
2. Open admin dashboard.
3. Import backend records.
4. Approve the record.
5. Click Export Shapefile.

Install:
1. Copy all files to your frontend folder.
2. Replace existing files.
3. Open admin-dashboard.html?v=640.
4. Press Ctrl + F5.
