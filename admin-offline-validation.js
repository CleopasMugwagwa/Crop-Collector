
(function(){
  "use strict";

  const DB_NAME = "crop_collector_offline_db";
  const DB_VERSION = 1;
  const API_HOST = location.hostname || '127.0.0.1';
  const isLocalApiHost = API_HOST === 'localhost' || API_HOST === '127.0.0.1' || /^10\./.test(API_HOST) || /^192\.168\./.test(API_HOST) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(API_HOST);
  const API_BASE = window.CROP_COLLECTOR_API_BASE || (isLocalApiHost ? ('http://' + (API_HOST === 'localhost' ? '127.0.0.1' : API_HOST) + ':8000/api/v1') : 'https://crop-collector-backend.onrender.com/api/v1');

  let dbPromise = null;

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function now(){ return new Date().toISOString(); }

  function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function(event){
        const db = event.target.result;
        if(!db.objectStoreNames.contains("records")){
          const store = db.createObjectStore("records", {keyPath:"local_id"});
          store.createIndex("sync_status", "sync_status", {unique:false});
          store.createIndex("validation_status", "validation_status", {unique:false});
        }
        if(!db.objectStoreNames.contains("sync_queue")){
          const q = db.createObjectStore("sync_queue", {keyPath:"queue_id"});
          q.createIndex("status", "status", {unique:false});
          q.createIndex("local_id", "local_id", {unique:false});
        }
        if(!db.objectStoreNames.contains("validation_logs")){
          const v = db.createObjectStore("validation_logs", {keyPath:"log_id"});
          v.createIndex("local_id", "local_id", {unique:false});
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function getAll(storeName){
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(storeName, value){
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getRecord(local_id){
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readonly");
      const req = tx.objectStore("records").get(local_id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function safe(value, fallback="-"){
    if(value === null || value === undefined || value === "") return fallback;
    if(typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function attr(record, keys, fallback="-"){
    const src = Object.assign({}, record.attributes || {}, record || {});
    for(const k of keys){
      if(src[k] !== undefined && src[k] !== null && src[k] !== "") return src[k];
    }
    return fallback;
  }

  function status(record){
    return record.validation_status || "pending";
  }

  async function backendReachable(){
    if(!navigator.onLine) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try{
      const res = await fetch(API_BASE.replace(/\/api\/v1\/?$/, "") + "/docs", {signal:controller.signal});
      clearTimeout(timer);
      return res.ok;
    }catch(error){
      clearTimeout(timer);
      return false;
    }
  }

  async function sendValidationToBackend(record, action, comment){
    if(!record.server_id) return false;
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    const endpoint = API_BASE + "/records/" + encodeURIComponent(record.server_id) + "/validation";
    const res = await fetch(endpoint, {
      method:"PATCH",
      headers:Object.assign({
        "Content-Type":"application/json",
        "Accept":"application/json"
      }, token ? {Authorization:"Bearer " + token} : {}),
      body:JSON.stringify({validation_status:action, validation_comment:comment || "", validated_at:now()})
    });
    if(!res.ok) throw new Error("Backend validation failed HTTP " + res.status);
    return true;
  }

  async function validateRecord(local_id, action){
    const record = await getRecord(local_id);
    if(!record){
      alert("Record not found.");
      return;
    }

    let comment = "";
    if(action === "needs_correction" || action === "rejected"){
      comment = prompt("Enter validation comment:", action === "needs_correction" ? "Please correct this record." : "Record rejected.");
      if(comment === null) return;
    }

    record.validation_status = action;
    record.validation_comment = comment;
    record.validated_by = localStorage.getItem("username") || "admin";
    record.validated_at = now();
    record.updated_at = now();

    try{
      if(await backendReachable()){
        try{ await sendValidationToBackend(record, action, comment); }catch(error){ record.validation_sync_error = error.message; }
      }
    }catch(error){}

    await put("records", record);
    await put("validation_logs", {
      log_id:"val_" + Date.now() + "_" + Math.random().toString(36).slice(2,8),
      local_id:record.local_id,
      server_id:record.server_id || null,
      action,
      comment,
      validated_by:record.validated_by,
      created_at:now()
    });

    await render();
  }

  async function exportApprovedGeoJSON(){
    const records = await getAll("records");
    const approved = records.filter(r => r.validation_status === "approved");
    const features = approved.map((r, i) => {
      const props = Object.assign({}, r.attributes || {}, {
        local_id:r.local_id,
        server_id:r.server_id,
        survey_name:r.survey_name,
        collector_name:r.collector_name,
        validation_status:r.validation_status
      });
      return {type:"Feature", id:r.server_id || r.local_id || i+1, geometry:r.geometry || null, properties:props};
    }).filter(f => f.geometry);
    download("approved_records.geojson", JSON.stringify({type:"FeatureCollection", features}, null, 2), "application/geo+json");
  }

  async function exportApprovedCsv(){
    const records = (await getAll("records")).filter(r => r.validation_status === "approved");
    const rows = records.map(r => Object.assign({}, r.attributes || {}, {
      local_id:r.local_id,
      server_id:r.server_id || "",
      survey_name:r.survey_name || "",
      collector_name:r.collector_name || "",
      sync_status:r.sync_status || "",
      validation_status:r.validation_status || ""
    }));
    const cols = Array.from(rows.reduce((set,row) => { Object.keys(row).forEach(k => set.add(k)); return set; }, new Set()));
    const esc = v => '"' + String(v ?? "").replace(/"/g,'""') + '"';
    const csv = [cols.join(","), ...rows.map(row => cols.map(c => esc(row[c])).join(","))].join("\n");
    download("approved_records.csv", csv, "text/csv");
  }

  async function exportShapefileRequest(){
    const message = document.getElementById("backend-action-message");
    try{
      if(message) message.textContent = "Requesting approved-record shapefile ZIP from backend...";
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(API_BASE + "/exports/shapefile", {
        method:"POST",
        headers:Object.assign({
          "Content-Type":"application/json",
          "Accept":"application/zip"
        }, token ? {Authorization:"Bearer " + token} : {}),
        body:JSON.stringify({approved_only:true, geometry:"polygons"})
      });
      if(!res.ok) throw new Error("Shapefile export failed HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "approved_crop_polygons_shapefile.zip";
      a.click();
      URL.revokeObjectURL(url);
      if(message) message.textContent = "Shapefile ZIP downloaded successfully.";
    }catch(error){
      const records = (await getAll("records")).filter(r => r.validation_status === "approved");
      const payload = {
        note:"Backend shapefile endpoint was not reachable. Use this payload for backend shapefile generation.",
        error:error.message,
        target_endpoint:"POST /api/v1/exports/shapefile with geometry=polygons",
        export_filter:"approved_only_polygons",
        records
      };
      download("approved_shapefile_export_request.json", JSON.stringify(payload, null, 2), "application/json");
      if(message) message.textContent = "Backend shapefile export failed. A shapefile request JSON was downloaded instead.";
    }
  }

  function download(filename, content, mime){
    const blob = new Blob([content], {type:mime || "text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }


  async function importBackendRecords(){
    const message = document.getElementById("backend-action-message");
    try{
      if(message) message.textContent = "Loading records from backend...";
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(API_BASE + "/records?limit=1000", {
        headers:Object.assign({"Accept":"application/json"}, token ? {Authorization:"Bearer " + token} : {})
      });
      if(!res.ok) throw new Error("Backend records failed HTTP " + res.status);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.items || data.records || data.data || []);
      let count = 0;

      for(const row of rows){
        const local_id = row.sync_local_id || row.local_id || ("server_" + row.id);
        const record = {
          local_id,
          server_id:row.id || row.server_id || null,
          survey_name:row.survey_name || "",
          module:row.module || row.capture_type || "crop",
          collector_name:row.collector_name || row.owner_name || "Backend",
          geometry_type:row.geometry ? row.geometry.type : row.capture_type,
          geometry:row.geometry || null,
          attributes:Object.assign({}, row.offline_payload || {}, row.ministry_extra_data || {}, row),
          created_at:row.created_at || now(),
          updated_at:row.updated_at || now(),
          sync_status:"synced",
          validation_status:row.validation_status || row.review_status || "pending",
          validation_comment:row.validation_comment || row.review_comment || "",
          record_status:"submitted",
          sync_attempts:0,
          last_sync_error:null
        };
        await put("records", record);
        count += 1;
      }

      if(message) message.textContent = "Imported " + count + " backend record(s) into the admin validation workspace.";
      await render();
    }catch(error){
      if(message) message.textContent = "Backend import failed: " + error.message;
      alert("Backend import failed: " + error.message);
    }
  }

  function ensurePanel(){
    if(document.getElementById("admin-offline-workflow")) return;

    const target = document.querySelector("main") || document.querySelector(".dashboard-content") || document.body;
    const panel = document.createElement("section");
    panel.id = "admin-offline-workflow";
    panel.className = "admin-offline-workflow";
    panel.innerHTML = `
      <details>
        <summary>Offline Sync and Validation Workflow</summary>
        <div class="admin-sync-grid">
          <div class="admin-sync-card"><strong id="admin-local-total">0</strong><span>Local Records</span></div>
          <div class="admin-sync-card"><strong id="admin-local-pending-sync">0</strong><span>Pending Sync</span></div>
          <div class="admin-sync-card"><strong id="admin-local-pending-validation">0</strong><span>Pending Validation</span></div>
          <div class="admin-sync-card"><strong id="admin-local-approved">0</strong><span>Approved</span></div>
          <div class="admin-sync-card"><strong id="admin-local-correction">0</strong><span>Needs Correction</span></div>
          <div class="admin-sync-card"><strong id="admin-local-rejected">0</strong><span>Rejected</span></div>
        </div>
        <div class="admin-offline-actions">
          <button type="button" id="admin-refresh-offline">Refresh Records</button>
          <button type="button" id="admin-import-backend-records" class="secondary">Import Backend Records</button>
          <button type="button" id="admin-export-approved-csv">Export Approved CSV</button>
          <button type="button" id="admin-export-approved-geojson">Export Approved GeoJSON</button>
          <button type="button" id="admin-export-approved-shapefile">Shapefile Request</button>
        </div>
        <div id="backend-action-message" class="backend-action-message">Backend-connected validation workflow is ready.</div>
        <div class="admin-validation-table-wrap">
          <table class="admin-validation-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Survey</th>
                <th>Collector</th>
                <th>Crop/Livestock</th>
                <th>Sync</th>
                <th>Validation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-offline-validation-body">
              <tr><td colspan="7">Loading local records...</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    `;
    target.append(panel);

    document.getElementById("admin-refresh-offline")?.addEventListener("click", render);
    document.getElementById("admin-import-backend-records")?.addEventListener("click", importBackendRecords);
    document.getElementById("admin-export-approved-csv")?.addEventListener("click", exportApprovedCsv);
    document.getElementById("admin-export-approved-geojson")?.addEventListener("click", exportApprovedGeoJSON);
    document.getElementById("admin-export-approved-shapefile")?.addEventListener("click", exportShapefileRequest);
  }

  async function render(){
    await openDb();
    ensurePanel();

    const records = await getAll("records");
    const total = records.length;
    const pendingSync = records.filter(r => r.sync_status === "pending" || r.sync_status === "failed").length;
    const pendingValidation = records.filter(r => (r.validation_status || "pending") === "pending").length;
    const approved = records.filter(r => r.validation_status === "approved").length;
    const correction = records.filter(r => r.validation_status === "needs_correction").length;
    const rejected = records.filter(r => r.validation_status === "rejected").length;

    const counts = {
      "admin-local-total":total,
      "admin-local-pending-sync":pendingSync,
      "admin-local-pending-validation":pendingValidation,
      "admin-local-approved":approved,
      "admin-local-correction":correction,
      "admin-local-rejected":rejected
    };
    Object.entries(counts).forEach(([id,value]) => { const el = document.getElementById(id); if(el) el.textContent = value; });

    const body = document.getElementById("admin-offline-validation-body");
    if(!body) return;

    if(!records.length){
      body.innerHTML = '<tr><td colspan="7">No local records found yet. Save a record in the collector first.</td></tr>';
      return;
    }

    body.innerHTML = records.slice().reverse().map(r => `
      <tr>
        <td>${safe(r.server_id || r.local_id)}</td>
        <td>${safe(r.survey_name)}</td>
        <td>${safe(r.collector_name)}</td>
        <td>${safe(attr(r, ["crop_type","crop","livestock_type","commodity"], r.module))}</td>
        <td>${safe(r.sync_status)}</td>
        <td><strong>${safe(status(r))}</strong></td>
        <td>
          <div class="admin-validation-actions">
            <button type="button" data-admin-validate="approved" data-local-id="${r.local_id}">Approve</button>
            <button type="button" class="correction" data-admin-validate="needs_correction" data-local-id="${r.local_id}">Correction</button>
            <button type="button" class="reject" data-admin-validate="rejected" data-local-id="${r.local_id}">Reject</button>
          </div>
        </td>
      </tr>
    `).join("");

    qsa("[data-admin-validate]").forEach(btn => {
      if(btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => validateRecord(btn.getAttribute("data-local-id"), btn.getAttribute("data-admin-validate")));
    });
  }

  function boot(){
    render();
    setTimeout(render, 1000);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();


/* v640: force all shapefile export buttons to call the backend ZIP endpoint */
(function(){
  "use strict";
  const API_HOST = location.hostname || '127.0.0.1';
  const isLocalApiHost = API_HOST === 'localhost' || API_HOST === '127.0.0.1' || /^10\./.test(API_HOST) || /^192\.168\./.test(API_HOST) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(API_HOST);
  const API_BASE = window.CROP_COLLECTOR_API_BASE || (isLocalApiHost ? ('http://' + (API_HOST === 'localhost' ? '127.0.0.1' : API_HOST) + ':8000/api/v1') : 'https://crop-collector-backend.onrender.com/api/v1');

  function showMessage(text){
    let box = document.getElementById("shapefile-export-status-v640");
    if(!box){
      box = document.createElement("div");
      box.id = "shapefile-export-status-v640";
      box.style.cssText = "margin:1rem;padding:.85rem 1rem;border-radius:14px;background:#edf7ee;color:#14532d;border:1px solid #d9ead9;font-weight:700;";
      const target = document.getElementById("admin-structured-features") || document.querySelector("main") || document.body;
      target.prepend(box);
    }
    box.textContent = text;
  }

  async function downloadShapefileZip(){
    showMessage("Preparing shapefile ZIP from backend...");
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");

    const response = await fetch(API_BASE + "/exports/shapefile", {
      method:"POST",
      headers:Object.assign({
        "Content-Type":"application/json",
        "Accept":"application/zip"
      }, token ? {Authorization:"Bearer " + token} : {}),
      body:JSON.stringify({approved_only:true, geometry:"polygons"})
    });

    if(!response.ok){
      let detail = "";
      try{
        const data = await response.json();
        detail = data.detail || JSON.stringify(data);
      }catch(error){
        detail = await response.text();
      }
      throw new Error("HTTP " + response.status + ": " + detail);
    }

    const blob = await response.blob();
    if(!blob.size) throw new Error("Backend returned an empty ZIP file.");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "approved_crop_polygons_shapefile.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showMessage("Shapefile ZIP downloaded: approved_crop_polygons_shapefile.zip");
  }

  function bindShapefileButtons(){
    document.querySelectorAll("button,[data-admin-export]").forEach(function(btn){
      const text = (btn.textContent || "").toLowerCase();
      const action = (btn.getAttribute("data-admin-export") || "").toLowerCase();

      if(action === "shapefile" || text.includes("shapefile")){
        if(btn.dataset.shapefileV640 === "true") return;
        btn.dataset.shapefileV640 = "true";

        btn.addEventListener("click", async function(event){
          event.preventDefault();
          event.stopImmediatePropagation();
          try{
            await downloadShapefileZip();
          }catch(error){
            showMessage("Shapefile ZIP was not created: " + error.message);
            alert("Shapefile ZIP was not created.\n\nReason: " + error.message + "\n\nFix: approve at least one record with geometry, confirm backend is running, then click Export Shapefile again.");
          }
        }, true);
      }
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bindShapefileButtons, {once:true});
  }else{
    bindShapefileButtons();
  }
  setTimeout(bindShapefileButtons, 1000);
  setTimeout(bindShapefileButtons, 2500);
})();
