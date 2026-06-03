
(function(){
  "use strict";

  const DB_NAME = "crop_collector_offline_db";
  const DB_VERSION = 1;
  const API_HOST = location.hostname && location.hostname !== "localhost" ? location.hostname : "127.0.0.1";
  const API_BASE = "http://" + API_HOST + ":8000/api/v1";

  let dbPromise = null;

  function now(){ return new Date().toISOString(); }

  function uuid(prefix){
    const rnd = Math.random().toString(36).slice(2, 10);
    return (prefix || "local") + "_" + Date.now() + "_" + rnd;
  }

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
          store.createIndex("survey_name", "survey_name", {unique:false});
          store.createIndex("collector_name", "collector_name", {unique:false});
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

        if(!db.objectStoreNames.contains("settings")){
          db.createObjectStore("settings", {keyPath:"key"});
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return dbPromise;
  }

  async function tx(storeName, mode, callback){
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let result;
      try{ result = callback(store); }catch(error){ reject(error); return; }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function put(storeName, value){
    return tx(storeName, "readwrite", store => store.put(value));
  }

  async function getAll(storeName){
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function getOne(storeName, key){
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteOne(storeName, key){
    return tx(storeName, "readwrite", store => store.delete(key));
  }

  function formToObject(form){
    const data = {};
    const fd = new FormData(form);
    fd.forEach((value, key) => {
      if(data[key] !== undefined){
        if(!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      }else{
        data[key] = value;
      }
    });
    return data;
  }

  function getSelectedSurveyName(attributes){
    return attributes.survey_name ||
      document.getElementById("survey-name")?.value ||
      document.getElementById("survey-select")?.value ||
      localStorage.getItem("selectedSurveyName") ||
      "Unspecified Survey";
  }

  function getCollectorName(){
    return localStorage.getItem("collector_name") ||
      localStorage.getItem("username") ||
      localStorage.getItem("displayName") ||
      document.querySelector(".user-info span")?.textContent?.trim() ||
      "Collector";
  }

  function getModule(attributes){
    const module = attributes.module || attributes.survey_type || window.currentSurveyModule || window.selectedSurveyType;
    if(String(module || "").toLowerCase().includes("livestock")) return "livestock";
    return "crop";
  }

  function getGeometry(attributes){
    const candidates = [
      window.currentGeometry,
      window.selectedGeometry,
      window.drawnGeometry,
      window.lastDrawnGeometry
    ];

    for(const c of candidates){
      if(c && typeof c === "object" && c.type && c.coordinates !== undefined) return c;
    }

    try{
      if(window.CropCollectorGeometryCapture && typeof window.CropCollectorGeometryCapture.scanGlobals === "function"){
        const g = window.CropCollectorGeometryCapture.scanGlobals();
        if(g && g.type && g.coordinates !== undefined) return g;
      }
    }catch(error){}

    try{
      const cached = JSON.parse(localStorage.getItem("crop_collector_last_geometry") || "null");
      if(cached && cached.geometry && cached.geometry.type && cached.geometry.coordinates !== undefined){
        return cached.geometry;
      }
    }catch(error){}

    const groups = [
      window.drawnItems,
      window.featureGroup,
      window.editableLayers,
      window.drawnFeatureGroup,
      window.fieldBoundaryLayer
    ];

    for(const group of groups){
      try{
        if(group && typeof group.toGeoJSON === "function"){
          const gj = group.toGeoJSON();
          if(gj && gj.features && gj.features.length){
            return gj.features[gj.features.length - 1].geometry;
          }
        }
      }catch(error){}
    }

    const attrs = attributes || {};
    const locationName = attrs.location_name || attrs.locationName || attrs.location || "";
    const match = String(locationName).match(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/);
    if(match){
      const lat = Number(match[1]);
      const lon = Number(match[2]);
      if(Number.isFinite(lat) && Number.isFinite(lon)){
        return { type:"Point", coordinates:[lon, lat] };
      }
    }

    return null;
  }

  function recordFromForm(form){
    const attributes = formToObject(form);
    const local_id = uuid("local");
    const geometry = getGeometry(attributes);
    const module = getModule(attributes);

    return {
      local_id,
      server_id:null,
      survey_id:attributes.survey_id || null,
      survey_name:getSelectedSurveyName(attributes),
      module,
      collector_id:localStorage.getItem("user_id") || null,
      collector_name:getCollectorName(),
      geometry_type:geometry ? geometry.type : null,
      geometry,
      attributes,
      photos:[],
      created_at:now(),
      updated_at:now(),
      submitted_at:now(),
      sync_status:"pending",
      validation_status:"pending",
      record_status:"submitted",
      sync_attempts:0,
      last_sync_error:null
    };
  }

  function legacyMirrorRecord(record){
    try{
      const key = "crop_collector_records";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.push(record);
      localStorage.setItem(key, JSON.stringify(arr));
    }catch(error){}
  }

  async function addToSyncQueue(record){
    const item = {
      queue_id:uuid("queue"),
      local_id:record.local_id,
      operation:"CREATE_RECORD",
      endpoint:"/records",
      method:"POST",
      status:"pending",
      attempts:0,
      created_at:now(),
      last_error:null
    };
    await put("sync_queue", item);
    return item;
  }

  async function saveRecordLocally(record){
    await put("records", record);
    await addToSyncQueue(record);
    legacyMirrorRecord(record);
    await updateSyncPanel();
    return record;
  }

  function showMessage(message){
    const el = document.getElementById("offline-sync-message");
    if(el) el.textContent = message;
    const feedback = document.getElementById("collector-feedback-message");
    const box = document.getElementById("collector-feedback");
    if(feedback && box){
      feedback.textContent = message;
      box.hidden = false;
    }
  }

  async function backendReachable(){
    if(!navigator.onLine) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try{
      const response = await fetch("http://" + API_HOST + ":8000/docs", {signal:controller.signal});
      clearTimeout(timer);
      return response.ok;
    }catch(error){
      clearTimeout(timer);
      return false;
    }
  }

  async function uploadRecord(record){
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    const response = await fetch(API_BASE + "/records", {
      method:"POST",
      headers:Object.assign({
        "Content-Type":"application/json",
        "Accept":"application/json"
      }, token ? {Authorization:"Bearer " + token} : {}),
      body:JSON.stringify(record)
    });

    if(!response.ok){
      throw new Error("Upload failed HTTP " + response.status);
    }

    let result = {};
    try{ result = await response.json(); }catch(error){}
    return result;
  }

  async function syncPendingRecords(){
    const reachable = await backendReachable();
    if(!reachable){
      showMessage("Saved locally. Backend is offline, so records remain pending sync.");
      await updateSyncPanel();
      return {synced:0, failed:0, offline:true};
    }

    const queue = (await getAll("sync_queue")).filter(q => q.status === "pending" || q.status === "failed");
    let synced = 0;
    let failed = 0;

    for(const item of queue){
      const record = await getOne("records", item.local_id);
      if(!record){
        await deleteOne("sync_queue", item.queue_id);
        continue;
      }

      try{
        record.sync_status = "syncing";
        record.updated_at = now();
        await put("records", record);

        const result = await uploadRecord(record);
        record.sync_status = "synced";
        record.server_id = result.id || result.server_id || record.server_id || null;
        record.validation_status = record.validation_status || "pending";
        record.synced_at = now();
        record.last_sync_error = null;
        await put("records", record);
        await deleteOne("sync_queue", item.queue_id);
        synced += 1;
      }catch(error){
        item.status = "failed";
        item.attempts = (item.attempts || 0) + 1;
        item.last_error = error.message;
        await put("sync_queue", item);

        record.sync_status = "failed";
        record.sync_attempts = (record.sync_attempts || 0) + 1;
        record.last_sync_error = error.message;
        record.updated_at = now();
        await put("records", record);
        failed += 1;
      }
    }

    await updateSyncPanel();
    showMessage("Sync complete. Synced: " + synced + ". Failed: " + failed + ".");
    return {synced, failed, offline:false};
  }


  function getMainLocalQueue(){
    try{
      const raw = JSON.parse(localStorage.getItem("local_field_entries_queue") || "[]");
      return Array.isArray(raw) ? raw : [];
    }catch(error){
      return [];
    }
  }

  function mainQueueStatusCounts(){
    const queue = getMainLocalQueue();
    return {
      total: queue.length,
      pending: queue.filter(item => (item.syncStatus || item.sync_status || "pending") === "pending").length,
      synced: queue.filter(item => (item.syncStatus || item.sync_status) === "synced").length,
      failed: queue.filter(item => (item.syncStatus || item.sync_status) === "failed").length
    };
  }
  async function counts(){
    const records = await getAll("records");
    const queue = await getAll("sync_queue");
    const main = mainQueueStatusCounts();
    return {
      total:records.length + main.total,
      pending:records.filter(r => r.sync_status === "pending").length + main.pending,
      synced:records.filter(r => r.sync_status === "synced").length + main.synced,
      failed:records.filter(r => r.sync_status === "failed").length + main.failed,
      pendingValidation:records.filter(r => (r.validation_status || "pending") === "pending").length,
      queue:queue.length + main.pending + main.failed
    };
  }

  async function updateSyncPanel(){
    const c = await counts();

    const ids = {
      "offline-total-records":c.total,
      "offline-pending-sync":c.pending,
      "offline-synced-records":c.synced,
      "offline-failed-sync":c.failed,
      "pending-count":c.pending,
      "synced-count":c.synced,
      "failed-count":c.failed
    };

    Object.entries(ids).forEach(([id,value]) => {
      const el = document.getElementById(id);
      if(el) el.textContent = value;
    });

    const status = document.getElementById("offline-sync-message");
    if(status){
      if(c.pending || c.failed){
        const count = c.pending + c.failed;
        status.textContent = localStorage.getItem("access_token")
          ? `${count} local record${count === 1 ? "" : "s"} waiting to sync.`
          : `${count} local record${count === 1 ? "" : "s"} saved on this device. Sign in before syncing to the backend.`;
      }else{
        status.textContent = navigator.onLine
          ? "Online. No pending local records."
          : "Offline. New records will be saved locally.";
      }
    }
  }

  function installPanel(){
    if(document.getElementById("offline-sync-panel")) return;

    const sidebar = document.getElementById("sidebar") || document.querySelector("aside") || document.body;
    const panel = document.createElement("details");
    panel.id = "offline-sync-panel";
    panel.className = "offline-sync-panel";
    panel.open = false;
    panel.innerHTML = `
      <summary>Offline Save & Sync</summary>
      <div class="sync-body">
        <div class="sync-status-grid">
          <div class="sync-status-card"><strong id="offline-total-records">0</strong><span>Local Records</span></div>
          <div class="sync-status-card"><strong id="offline-pending-sync">0</strong><span>Pending Sync</span></div>
          <div class="sync-status-card"><strong id="offline-synced-records">0</strong><span>Synced</span></div>
          <div class="sync-status-card"><strong id="offline-failed-sync">0</strong><span>Failed</span></div>
        </div>
        <div class="sync-actions">
          <button type="button" id="sync-now-btn">Sync Now</button>
          <button type="button" id="download-local-backup-btn" class="secondary">Backup</button>
        </div>
        <div id="offline-sync-message">Offline-first sync is ready.</div>
      </div>
    `;

    sidebar.appendChild(panel);

    document.getElementById("sync-now-btn")?.addEventListener("click", async () => {
      const main = mainQueueStatusCounts();
      if(main.pending || main.failed){
        if(window.currentUser?.isGuest || !localStorage.getItem("access_token")){
          showMessage(`Saved locally. ${main.pending + main.failed} record${main.pending + main.failed === 1 ? "" : "s"} waiting. Sign in before syncing to the backend.`);
          await updateSyncPanel();
          return;
        }
        if(typeof window.pushAllPending === "function"){
          await window.pushAllPending({silent:false, reason:"offline-panel"});
          await updateSyncPanel();
          return;
        }
      }
      await syncPendingRecords();
    });
    document.getElementById("download-local-backup-btn")?.addEventListener("click", async () => {
      const records = await getAll("records");
      const main_queue = getMainLocalQueue();
      const blob = new Blob([JSON.stringify({records, main_queue, exported_at:now()}, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "crop_collector_local_backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function interceptFormSave(){
    const form = document.getElementById("crop-form");
    if(!form || form.dataset.offlineSyncPatched === "true") return;

    form.dataset.offlineSyncPatched = "disabled-release-audit";
    window.__offlineSyncFormInterceptDisabled = true;
  }

  async function importLegacyRecordsOnce(){
    const flag = localStorage.getItem("offline_indexeddb_import_v540");
    if(flag === "done") return;

    try{
      const raw = JSON.parse(localStorage.getItem("crop_collector_records") || "[]");
      if(Array.isArray(raw)){
        for(const item of raw){
          if(!item || typeof item !== "object") continue;
          const local_id = item.local_id || uuid("legacy");
          const record = Object.assign({
            local_id,
            server_id:null,
            created_at:item.created_at || now(),
            updated_at:item.updated_at || now(),
            sync_status:item.sync_status || "pending",
            validation_status:item.validation_status || "pending",
            record_status:item.record_status || "submitted",
            sync_attempts:item.sync_attempts || 0,
            last_sync_error:item.last_sync_error || null
          }, item, {local_id});
          await put("records", record);
          if(record.sync_status !== "synced") await addToSyncQueue(record);
        }
      }
      localStorage.setItem("offline_indexeddb_import_v540", "done");
    }catch(error){}
  }

  async function boot(){
    try{
      await openDb();
      await importLegacyRecordsOnce();
      installPanel();
      interceptFormSave();
      await updateSyncPanel();

      window.CropCollectorOfflineSync = {
        openDb,
        getRecords:() => getAll("records"),
        getQueue:() => getAll("sync_queue"),
        saveRecordLocally,
        syncPendingRecords,
        updateSyncPanel,
        counts
      };

      window.addEventListener("online", () => {
        showMessage("Device is online. Attempting sync...");
        syncPendingRecords();
      });
      window.addEventListener("offline", () => updateSyncPanel());

      if(navigator.onLine) setTimeout(syncPendingRecords, 1500);
    }catch(error){
      console.error("Offline sync engine failed:", error);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();


/* v610 helper: expose force retry for failed queue records */
(function(){
  async function bootRetryHelper(){
    if(!window.CropCollectorOfflineSync) return;
    const original = window.CropCollectorOfflineSync.syncPendingRecords;
    window.CropCollectorOfflineSync.retryAll = async function(){
      const db = await window.CropCollectorOfflineSync.openDb();
      const tx = db.transaction("sync_queue", "readwrite");
      const store = tx.objectStore("sync_queue");
      const req = store.getAll();
      req.onsuccess = function(){
        (req.result || []).forEach(item => {
          item.status = "pending";
          store.put(item);
        });
      };
      await new Promise(resolve => { tx.oncomplete = resolve; tx.onerror = resolve; });
      return original();
    };
  }
  setTimeout(bootRetryHelper, 1000);
})();
