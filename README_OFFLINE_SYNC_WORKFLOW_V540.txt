PROJECT OFFLINE-FIRST SYNC WORKFLOW v540

This package implements the proper offline-first workflow:

Collector App:
- Form saves locally first into IndexedDB.
- Each saved record receives:
  sync_status: pending
  validation_status: pending
  record_status: submitted
- A sync queue is created automatically.
- If the backend is online, pending records attempt to sync automatically.
- If backend is offline, records remain safely stored locally.
- The collector screen now has an Offline Save & Sync panel:
  Local Records
  Pending Sync
  Synced
  Failed
  Sync Now
  Backup

Admin Dashboard:
- Reads the same IndexedDB local records.
- Shows local records, pending sync, pending validation, approved, correction and rejected counts.
- Validator/admin can:
  Approve
  Send for Correction
  Reject
- Approved-only exports added:
  CSV
  GeoJSON
  Shapefile request JSON

Architecture:
Collector form -> IndexedDB records -> sync_queue -> FastAPI backend -> admin validation -> approved exports

Important:
This frontend version saves and validates in IndexedDB for immediate testing.
For production, connect these actions to FastAPI/PostGIS endpoints:
POST  /api/v1/records
PATCH /api/v1/records/{id}/validation
POST  /api/v1/exports/shapefile

Install:
1. Backup your current frontend folder.
2. Extract this ZIP.
3. Copy all files into your frontend folder.
4. Replace existing files.
5. Restart Live Server.
6. Open:
   WELCOME.html?screen=collector&v=540
   admin-dashboard.html?v=540
7. Press Ctrl + F5.

Backend:
Start with:
cd "C:\Users\hp\Desktop\Crop_Collector App\Crop collector 25\backend"
python -m uvicorn app.main:app --reload

Check:
http://127.0.0.1:8000/docs
