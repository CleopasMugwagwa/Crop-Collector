(function(){
  "use strict";

  const SESSION_KEY = "crop_collector_clean_test_started_at";
  const LOCAL_QUEUE_KEY = "local_field_entries_queue";
  const LEGACY_GUEST_KEY = "guest_field_entries";
  const SYNC_HISTORY_KEY = "sync_event_history";
  const LEGACY_RECORDS_KEY = "crop_collector_records";
  const OFFLINE_DB = "crop_collector_offline_db";
  const APP_DB = "CropCollectorDB";

  function now(){ return new Date().toISOString(); }
  function readJson(key, fallback){
    try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch{ return fallback; }
  }
  function downloadJson(name, payload){
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function idbAll(dbName, stores){
    return new Promise(resolve => {
      if(!window.indexedDB) return resolve({});
      const request = indexedDB.open(dbName);
      request.onerror = () => resolve({});
      request.onsuccess = () => {
        const db = request.result;
        const existing = stores.filter(name => db.objectStoreNames.contains(name));
        if(!existing.length){ db.close(); return resolve({}); }
        const tx = db.transaction(existing, "readonly");
        const output = {};
        let pending = existing.length;
        existing.forEach(storeName => {
          const getReq = tx.objectStore(storeName).getAll();
          getReq.onsuccess = () => { output[storeName] = getReq.result || []; if(--pending === 0){ db.close(); resolve(output); } };
          getReq.onerror = () => { output[storeName] = []; if(--pending === 0){ db.close(); resolve(output); } };
        });
      };
    });
  }
  function deleteDb(dbName){
    return new Promise(resolve => {
      if(!window.indexedDB) return resolve(false);
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(false);
    });
  }
  async function collectBackup(){
    return {
      exported_at: now(),
      app_version: window.CropCollectorApp?.config?.appVersion || "unknown",
      current_user: window.currentUser || window.CropCollectorApp?.state?.currentUser || null,
      clean_test_session_started_at: localStorage.getItem(SESSION_KEY) || null,
      localStorage: {
        [LOCAL_QUEUE_KEY]: readJson(LOCAL_QUEUE_KEY, []),
        [LEGACY_GUEST_KEY]: readJson(LEGACY_GUEST_KEY, []),
        [LEGACY_RECORDS_KEY]: readJson(LEGACY_RECORDS_KEY, []),
        [SYNC_HISTORY_KEY]: readJson(SYNC_HISTORY_KEY, [])
      },
      indexedDB: {
        [OFFLINE_DB]: await idbAll(OFFLINE_DB, ["records", "sync_queue", "validation_logs", "settings"]),
        [APP_DB]: await idbAll(APP_DB, ["offlineQueue"])
      }
    };
  }
  async function backupLocalRecords(){
    const backup = await collectBackup();
    downloadJson("crop_collector_pre_clean_backup_" + new Date().toISOString().slice(0,10) + ".json", backup);
    return backup;
  }
  async function clearForCleanTest(){
    const message = "This will back up and clear local test records on this device only. Synced backend records are not deleted. Continue?";
    if(!confirm(message)) return;
    await backupLocalRecords();
    localStorage.removeItem(LOCAL_QUEUE_KEY);
    localStorage.removeItem(LEGACY_GUEST_KEY);
    localStorage.removeItem(LEGACY_RECORDS_KEY);
    localStorage.removeItem(SYNC_HISTORY_KEY);
    await deleteDb(OFFLINE_DB);
    await deleteDb(APP_DB);
    localStorage.setItem(SESSION_KEY, now());
    try{
      if(window.CropCollectorApp?.state){
        window.CropCollectorApp.state.localQueueInMemory = [];
        window.CropCollectorApp.state.fieldEntries = [];
      }
      if(Array.isArray(window.fieldEntries)) window.fieldEntries.length = 0;
      window.drawnItems?.clearLayers?.();
      window.selectedPolygon = null;
      window.renderEntries?.();
      window.CropCollectorOfflineSync?.updateSyncPanel?.();
      window.CropCollectorDraftQueuePolish?.update?.();
      window.showCollectorFeedback?.("Clean test session started. Old local records were backed up and cleared from this device.", "success", {sticky:true});
    }catch(error){}
    setTimeout(() => location.replace("WELCOME.html?screen=login&v=1063-clean-test"), 900);
  }
  function ensurePanel(){
    const list = document.getElementById("fields-list");
    if(!list) return null;
    let panel = document.getElementById("clean-test-session-panel");
    if(panel) return panel;
    panel = document.createElement("div");
    panel.id = "clean-test-session-panel";
    panel.className = "clean-test-session-panel";
    panel.innerHTML = `
      <div class="clean-test-copy">
        <strong>Clean testing</strong>
        <span id="clean-test-session-label">No clean test session started on this device.</span>
      </div>
      <div class="clean-test-actions">
        <button type="button" id="clean-test-backup-btn" class="secondary">Backup</button>
        <button type="button" id="clean-test-clear-btn" class="danger-lite">Start Clean Test</button>
      </div>`;
    list.insertAdjacentElement("beforebegin", panel);
    panel.querySelector("#clean-test-backup-btn")?.addEventListener("click", backupLocalRecords);
    panel.querySelector("#clean-test-clear-btn")?.addEventListener("click", clearForCleanTest);
    return panel;
  }
  function updatePanel(){
    const panel = ensurePanel();
    if(!panel) return;
    const started = localStorage.getItem(SESSION_KEY);
    const label = panel.querySelector("#clean-test-session-label");
    if(label){
      label.textContent = started
        ? "Clean session started " + new Date(started).toLocaleString() + ". Use fresh surveys/records for final testing."
        : "Backup old drafts, then start fresh records for final testing.";
    }
  }
  function installStyle(){
    if(document.getElementById("clean-test-session-style")) return;
    const style = document.createElement("style");
    style.id = "clean-test-session-style";
    style.textContent = `.clean-test-session-panel{display:flex;gap:.75rem;align-items:center;justify-content:space-between;margin:.75rem 0;padding:.85rem;border:1px solid #b9d8bd;border-radius:14px;background:#f7fbf6;color:#0b4f1f;box-shadow:0 8px 22px rgba(23,74,37,.07)}.clean-test-copy{display:grid;gap:.2rem;min-width:0}.clean-test-copy strong{font-size:.95rem}.clean-test-copy span{font-size:.82rem;color:#52665a;line-height:1.35}.clean-test-actions{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:flex-end}.clean-test-actions button{width:auto;min-height:40px;padding:.55rem .75rem;border-radius:10px}.danger-lite{background:#fff1f0!important;border:1px solid #f4b7b2!important;color:#b42318!important}@media(max-width:620px){.clean-test-session-panel{align-items:stretch;flex-direction:column}.clean-test-actions button{flex:1}}`;
    document.head.appendChild(style);
  }
  function boot(){
    installStyle();
    updatePanel();
    const retry = setInterval(updatePanel, 800);
    setTimeout(() => clearInterval(retry), 8000);
    window.CropCollectorCleanTest = { backup:backupLocalRecords, clear:clearForCleanTest, update:updatePanel };
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();