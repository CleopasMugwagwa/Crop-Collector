(function(){
  "use strict";

  const LOCAL_QUEUE_KEY = "local_field_entries_queue";

  function readQueue(){
    try{ return JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || "[]"); }
    catch{ return []; }
  }

  function statusOf(item){
    return String(item?.syncStatus || item?.sync_status || (item?.source === "backend" ? "synced" : "pending")).toLowerCase();
  }

  function moduleOf(item){
    const direct = item?.primaryModule || item?.primary_module || item?.module;
    if(direct === "crop" || direct === "livestock") return direct;
    const id = String(item?.questionnaireId || item?.questionnaire_id || "");
    return id.startsWith("LVS-") ? "livestock" : "crop";
  }

  function createdToday(item){
    const raw = item?.createdAtLocal || item?.created_at || item?.createdAt || item?.submitted_at || "";
    if(!raw) return false;
    const d = new Date(raw);
    if(Number.isNaN(d.getTime())) return false;
    return d.toDateString() === new Date().toDateString();
  }

  function allRecords(){
    const queue = readQueue();
    const entries = Array.isArray(window.fieldEntries) ? window.fieldEntries : [];
    const seen = new Set();
    const merged = [];
    entries.concat(queue).forEach(item => {
      const key = String(item?.localId || item?.local_id || item?.id || Math.random());
      if(seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
    return merged;
  }

  function ensureDashboard(){
    let panel = document.getElementById("collector-field-dashboard");
    if(panel) return panel;

    const modeSection = document.querySelector("#sidebar .section");
    if(!modeSection) return null;

    panel = document.createElement("section");
    panel.id = "collector-field-dashboard";
    panel.className = "collector-field-dashboard";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = `
      <div class="collector-field-dashboard-head">
        <div>
          <strong>Field Dashboard</strong>
          <span>Collector status for this device</span>
        </div>
        <button type="button" id="collector-dashboard-refresh" title="Refresh field status" aria-label="Refresh field status">
          <i data-feather="refresh-cw"></i>
        </button>
      </div>
      <div class="collector-field-dashboard-grid">
        <div class="collector-field-card" data-state="neutral">
          <span>GPS</span>
          <strong id="collector-dashboard-gps">Waiting</strong>
          <small id="collector-dashboard-geofence">Geofence pending</small>
        </div>
        <div class="collector-field-card" data-state="neutral">
          <span>Today</span>
          <strong id="collector-dashboard-today">0</strong>
          <small id="collector-dashboard-today-detail">0 crop / 0 livestock</small>
        </div>
        <div class="collector-field-card" data-state="neutral">
          <span>Sync</span>
          <strong id="collector-dashboard-sync">0 pending</strong>
          <small id="collector-dashboard-sync-detail">0 failed</small>
        </div>
        <div class="collector-field-card" data-state="neutral">
          <span>Record</span>
          <strong id="collector-dashboard-module">Choose type</strong>
          <small id="collector-dashboard-step">Ready to start</small>
        </div>
      </div>
    `;
    modeSection.insertAdjacentElement("afterbegin", panel);
    panel.querySelector("#collector-dashboard-refresh")?.addEventListener("click", update);
    try{ feather.replace(); }catch(error){}
    return panel;
  }

  function setCardState(id, state){
    const node = document.getElementById(id)?.closest(".collector-field-card");
    if(node) node.dataset.state = state || "neutral";
  }

  function update(){
    const panel = ensureDashboard();
    if(!panel) return;

    const records = allRecords();
    const todayRecords = records.filter(createdToday);
    const cropToday = todayRecords.filter(item => moduleOf(item) === "crop").length;
    const livestockToday = todayRecords.filter(item => moduleOf(item) === "livestock").length;
    const pending = records.filter(item => ["pending","in_progress","queued"].includes(statusOf(item))).length;
    const failed = records.filter(item => statusOf(item) === "failed").length;

    const gps = document.getElementById("mobile-gps-status")?.textContent?.trim() || "Waiting";
    const geofence = document.getElementById("mobile-geofence-status")?.textContent?.trim() || "Geofence pending";
    const module = document.body.dataset.collectorPrimaryModule || window.activeCollectorPrimaryModule || "";
    const step = document.getElementById("collector-odk-step-label")?.textContent?.trim() || "Ready to start";
    const connection = document.getElementById("ops-connection")?.textContent?.trim() || (navigator.onLine ? "Online" : "Offline");

    document.getElementById("collector-dashboard-gps").textContent = gps;
    document.getElementById("collector-dashboard-geofence").textContent = geofence;
    document.getElementById("collector-dashboard-today").textContent = String(todayRecords.length);
    document.getElementById("collector-dashboard-today-detail").textContent = `${cropToday} crop / ${livestockToday} livestock`;
    document.getElementById("collector-dashboard-sync").textContent = `${pending} pending`;
    document.getElementById("collector-dashboard-sync-detail").textContent = `${failed} failed · ${connection}`;
    document.getElementById("collector-dashboard-module").textContent =
      module === "crop" ? "Crop Field" : module === "livestock" ? "Livestock" : "Choose type";
    document.getElementById("collector-dashboard-step").textContent = step.replace(/^Question\s+/i, "Q");

    setCardState("collector-dashboard-gps", /ready|granted/i.test(gps) ? "good" : /denied|unavailable/i.test(gps) ? "bad" : "warn");
    setCardState("collector-dashboard-today", todayRecords.length ? "good" : "neutral");
    setCardState("collector-dashboard-sync", failed ? "bad" : pending ? "warn" : "good");
    setCardState("collector-dashboard-module", module === "crop" || module === "livestock" ? "good" : "neutral");
  }

  function boot(){
    update();
    ["click","change","input"].forEach(type => {
      document.addEventListener(type, () => setTimeout(update, 120), true);
    });
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    setInterval(update, 2500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  window.CropCollectorFieldDashboard = { update };
})();
