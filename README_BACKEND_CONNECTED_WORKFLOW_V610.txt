PROJECT BACKEND-CONNECTED WORKFLOW v610

This version connects the v540 offline workflow to the backend patch v600.

What is new:
1. Admin dashboard can import backend records:
   - Click "Import Backend Records"
   - It fetches GET /api/v1/records
   - Records are placed into the admin validation workspace.

2. Validation is backend-aware:
   - If a record has server_id, Approve / Correction / Reject calls:
     PATCH /api/v1/records/{id}/validation
   - It still updates IndexedDB locally for immediate feedback.

3. Real shapefile export:
   - "Shapefile Request" now first calls:
     POST /api/v1/exports/shapefile
   - If backend is available, a ZIP is downloaded.
   - If backend is unavailable, it falls back to request JSON.

4. Collector sync:
   - Collector still saves locally first.
   - Sync sends pending records to:
     POST /api/v1/records

Install frontend:
1. Copy all files to your frontend folder.
2. Replace existing files.
3. Restart Live Server.
4. Open:
   WELCOME.html?screen=collector&v=610
   admin-dashboard.html?v=610
5. Press Ctrl + F5.

Install backend first:
Use backend_sync_records_patch_v600.zip.
Then confirm:
http://127.0.0.1:8000/docs

Routes required:
POST  /api/v1/records
GET   /api/v1/records
PATCH /api/v1/records/{record_id}/validation
POST  /api/v1/exports/shapefile
