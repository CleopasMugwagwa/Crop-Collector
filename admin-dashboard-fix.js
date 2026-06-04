
(function(){
  "use strict";

  function qsa(selector, root){
    return Array.from((root || document).querySelectorAll(selector));
  }

  function slug(text){
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/&/g,"and")
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-+|-+$/g,"");
  }

  function normalizeCards(){
    const cards = qsa(".card,.stat-card,.kpi-card,.metric-card,.overview-card,.summary-card,.dashboard-card,.info-card");
    cards.forEach(function(card){
      card.style.wordBreak = "normal";
      card.style.overflowWrap = "normal";
      card.style.height = "auto";

      const firstStrong = card.querySelector(":scope > strong:first-child");
      if(firstStrong){
        firstStrong.style.fontSize = "0.78rem";
        firstStrong.style.lineHeight = "1.25";
        firstStrong.style.wordBreak = "normal";
        firstStrong.style.overflowWrap = "normal";
      }

      card.querySelectorAll("span,.value,.metric-value,.stat-value,.kpi-value,.summary-value,.system-metric").forEach(function(el){
        const id = (el.id || "").toLowerCase();
        const txt = (el.textContent || "").trim();
        const isLong = id.includes("postgis") || id.includes("version") || txt.length > 30;
        el.style.fontSize = isLong ? "1.02rem" : "1.35rem";
        el.style.lineHeight = isLong ? "1.35" : "1.22";
        el.style.wordBreak = "normal";
        el.style.overflowWrap = "anywhere";
      });
    });
  }

  function getViewNameFromButton(button){
    return (
      button.getAttribute("data-dashboard-target") ||
      button.getAttribute("data-dashboard-nav") ||
      button.getAttribute("data-target") ||
      button.getAttribute("data-view") ||
      button.getAttribute("aria-controls") ||
      slug(button.textContent)
    );
  }

  function findView(name){
    if(!name) return null;

    const raw = String(name).trim();
    const safe = slug(raw);

    const selectors = [
      '[data-dashboard-view="' + raw + '"]',
      '[data-dashboard-view="' + safe + '"]',
      '[data-view-panel="' + raw + '"]',
      '[data-view-panel="' + safe + '"]',
      '[data-view="' + raw + '"]',
      '[data-view="' + safe + '"]'
    ];

    for(const selector of selectors){
      const el = document.querySelector(selector);
      if(el && !el.matches("button,a,option")) return el;
    }

    return (
      document.getElementById(raw) ||
      document.getElementById(safe) ||
      document.getElementById(safe + "-view") ||
      document.getElementById(safe + "-section") ||
      document.getElementById("view-" + safe) ||
      document.getElementById("section-" + safe)
    );
  }

  function getAllViews(){
    const views = new Set();
    qsa(".dashboard-view,[data-dashboard-view],.admin-view,[data-view-panel]").forEach(function(view){
      if(!view.matches("button,a,option")) views.add(view);
    });
    return Array.from(views);
  }

  function openDashboardView(name){
    const target = findView(name);
    if(!target) return false;

    const allViews = getAllViews();

    if(allViews.length){
      allViews.forEach(function(view){
        view.hidden = true;
        view.classList.remove("active","is-active","visible");
        view.style.display = "none";
      });

      target.hidden = false;
      target.classList.add("active","is-active","visible");
      target.style.display = "";
    }

    qsa("[data-dashboard-target],[data-dashboard-nav],.dashboard-menu button,.side-menu button,.admin-menu button,.dashboard-nav button,nav button").forEach(function(btn){
      const btnName = getViewNameFromButton(btn);
      const isActive = slug(btnName) === slug(name);
      btn.classList.toggle("active", isActive);
      btn.classList.toggle("is-active", isActive);
      if(isActive) btn.setAttribute("aria-current","page");
      else btn.removeAttribute("aria-current");
    });

    normalizeCards();
    return true;
  }

  function patchDashboardNavigation(){
    const buttons = qsa("[data-dashboard-target],[data-dashboard-nav],.dashboard-menu button,.side-menu button,.admin-menu button,.dashboard-nav button,nav button");

    buttons.forEach(function(button){
      if(button.dataset.fullAdminNavPatched === "true") return;

      const name = getViewNameFromButton(button);
      const view = findView(name);

      if(!view) return;

      button.dataset.fullAdminNavPatched = "true";
      button.type = "button";

      button.addEventListener("click", function(event){
        event.preventDefault();
        openDashboardView(name);
      });
    });

    const currentVisible = getAllViews().some(function(view){
      return !view.hidden && view.style.display !== "none";
    });

    if(!currentVisible){
      const activeButton = buttons.find(function(btn){
        return btn.classList.contains("active") || btn.classList.contains("is-active");
      });
      const firstButton = buttons.find(function(btn){
        return findView(getViewNameFromButton(btn));
      });
      const initial = activeButton || firstButton;
      if(initial) openDashboardView(getViewNameFromButton(initial));
    }
  }

  function keepSectionsOpenable(){
    qsa("details").forEach(function(d){
      d.style.maxWidth = "100%";
      d.style.overflow = "hidden";
    });

    qsa("[data-collapse-key]").forEach(function(panel){
      if(panel.dataset.fullAdminCollapsePatched === "true") return;
      panel.dataset.fullAdminCollapsePatched = "true";

      const heading = panel.querySelector("h2,h3,summary,.panel-title,.section-title");
      if(!heading) return;

      heading.style.cursor = "pointer";
      heading.addEventListener("click", function(){
        const collapsed = panel.classList.toggle("admin-collapsed");
        Array.from(panel.children).forEach(function(child){
          if(child === heading) return;
          child.style.display = collapsed ? "none" : "";
        });
      });
    });
  }

  function boot(){
    normalizeCards();
    patchDashboardNavigation();
    keepSectionsOpenable();

    setTimeout(normalizeCards, 400);
    setTimeout(function(){
      normalizeCards();
      patchDashboardNavigation();
      keepSectionsOpenable();
    }, 1200);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }

  window.addEventListener("resize", function(){
    setTimeout(normalizeCards, 100);
  });
})();


/* v520: structured export and sync actions */
(function(){
  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }

  function getLocalRecords(){
    const rows = [];
    for(let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      const lower = String(key || "").toLowerCase();
      if(!(lower.includes("record") || lower.includes("entry") || lower.includes("crop"))) continue;
      try{
        const value = JSON.parse(localStorage.getItem(key));
        if(Array.isArray(value)) rows.push(...value.filter(v => v && typeof v === "object"));
        else if(value && typeof value === "object") rows.push(value);
      }catch(error){}
    }
    return rows;
  }

  function download(filename, content, mime){
    const blob = new Blob([content], {type:mime || "text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function columns(rows){
    const set = new Set();
    rows.slice(0,50).forEach(r => Object.keys(r || {}).forEach(k => {
      if(typeof r[k] !== "object") set.add(k);
    }));
    return Array.from(set);
  }

  function exportCsv(rows){
    const cols = columns(rows);
    if(!cols.length){ download("crop_records.csv", "", "text/csv"); return; }
    const esc = v => '"' + String(v ?? "").replace(/"/g,'""') + '"';
    const csv = [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
    download("crop_records.csv", csv, "text/csv");
  }

  function exportGeoJSON(rows){
    const features = rows.map((r, i) => {
      let geometry = r.geometry || r.geom || r.geojson || null;
      if(typeof geometry === "string"){
        try{ geometry = JSON.parse(geometry); }catch(error){ geometry = null; }
      }
      if(geometry && geometry.type === "Feature") geometry = geometry.geometry;
      if(!geometry && r.latitude && r.longitude){
        geometry = {type:"Point", coordinates:[Number(r.longitude), Number(r.latitude)]};
      }
      const props = Object.assign({}, r);
      delete props.geometry; delete props.geom; delete props.geojson;
      return {type:"Feature", id:r.id || i+1, geometry, properties:props};
    }).filter(f => f.geometry);
    download("crop_records.geojson", JSON.stringify({type:"FeatureCollection", features}, null, 2), "application/geo+json");
  }

  function exportKml(rows){
    const placemarks = rows.map((r, i) => {
      const name = r.crop || r.crop_type || r.survey || r.survey_name || ("Record " + (i+1));
      const lon = r.longitude || r.lng;
      const lat = r.latitude || r.lat;
      if(!lon || !lat) return "";
      return `<Placemark><name>${String(name)}</name><Point><coordinates>${lon},${lat},0</coordinates></Point></Placemark>`;
    }).join("");
    const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}</Document></kml>`;
    download("crop_records.kml", kml, "application/vnd.google-earth.kml+xml");
  }

  function exportShapefileNotice(rows){
    const payload = {
      note:"Browser-only shapefile export needs backend ZIP generation. Use the backend /exports/shapefile endpoint if configured.",
      records: rows
    };
    download("shapefile_export_request.json", JSON.stringify(payload, null, 2), "application/json");
    alert("Shapefile export needs backend ZIP generation. I downloaded shapefile_export_request.json. Connect this button to your FastAPI shapefile endpoint for .zip output.");
  }

  async function checkBackend(){
    const host = location.hostname && location.hostname !== "localhost" ? location.hostname : "127.0.0.1";
    const base = `http://${host}:8000`;
    const el = document.getElementById("admin-backend-health");
    try{
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(base + "/docs", {signal:controller.signal});
      clearTimeout(timer);
      if(el) el.textContent = res.ok ? "Backend is reachable." : "Backend responded with status " + res.status;
    }catch(error){
      if(el) el.textContent = "Backend is not reachable. Start uvicorn first.";
    }
  }

  function updateSyncCount(){
    const rows = getLocalRecords();
    const pending = rows.filter(r => r.synced === false || r.sync_status === "pending" || r.pending_sync === true).length;
    const el = document.getElementById("admin-pending-sync-count");
    if(el) el.textContent = pending + " pending sync record(s) found in local storage.";
  }

  function openStructured(name){
    const target = document.getElementById("admin-feature-" + name);
    if(target){
      target.open = true;
      target.scrollIntoView({behavior:"smooth", block:"start"});
    }
  }

  function bind(){
    qsa("[data-admin-export]").forEach(btn => {
      if(btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-admin-export");
        const rows = getLocalRecords();
        if(type === "csv") exportCsv(rows);
        if(type === "geojson") exportGeoJSON(rows);
        if(type === "kml") exportKml(rows);
        if(type === "backup") download("crop_collector_local_backup.json", JSON.stringify({records:rows, localStorage:Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))}, null, 2), "application/json");
        if(type === "shapefile") {
          const real = document.getElementById("admin-export-approved-shapefile");
          if(real) real.click();
          else exportShapefileNotice(rows);
        }
      });
    });

    qsa("[data-admin-open]").forEach(btn => {
      if(btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-admin-open");
        openStructured(name);
        const nav = document.querySelector(`[data-dashboard-target="${name}"],[data-dashboard-nav="${name}"],button[data-view="${name}"]`);
        if(nav) nav.click();
      });
    });

    qsa("[data-admin-sync]").forEach(btn => {
      if(btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-admin-sync");
        if(action === "health") checkBackend();
        if(action === "push") alert("Sync push should call your existing app sync function or backend endpoint. Pending sync count has been checked.");
        updateSyncCount();
      });
    });

    updateSyncCount();
    checkBackend();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, {once:true});
  else bind();
})();


/* v530: validation workflow actions
   This gives the dashboard a clear validation method:
   - Approve record
   - Send for correction
   - Reject record
   Records are updated in localStorage for frontend testing.
   Connect the same buttons to FastAPI endpoints later for production. */
(function(){
  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }

  function getRecordKeyCandidates(){
    const keys = [];
    for(let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      const lower = String(key || "").toLowerCase();
      if(lower.includes("record") || lower.includes("entry") || lower.includes("crop")){
        keys.push(key);
      }
    }
    return keys;
  }

  function loadValidationRecords(){
    const rows = [];
    getRecordKeyCandidates().forEach(key => {
      try{
        const value = JSON.parse(localStorage.getItem(key));
        if(Array.isArray(value)){
          value.forEach((row, index) => {
            if(row && typeof row === "object") rows.push({row, key, index, array:true});
          });
        }else if(value && typeof value === "object"){
          rows.push({row:value, key, index:null, array:false});
        }
      }catch(error){}
    });
    return rows;
  }

  function saveRecord(ref, status){
    try{
      const now = new Date().toISOString();
      if(ref.array){
        const arr = JSON.parse(localStorage.getItem(ref.key) || "[]");
        if(arr[ref.index]){
          arr[ref.index].validation_status = status;
          arr[ref.index].review_status = status;
          arr[ref.index].validated_at = now;
          arr[ref.index].validated_by = "admin";
          localStorage.setItem(ref.key, JSON.stringify(arr));
        }
      }else{
        const obj = JSON.parse(localStorage.getItem(ref.key) || "{}");
        obj.validation_status = status;
        obj.review_status = status;
        obj.validated_at = now;
        obj.validated_by = "admin";
        localStorage.setItem(ref.key, JSON.stringify(obj));
      }
    }catch(error){
      alert("Failed to update validation status: " + error.message);
    }
  }

  function statusOf(row){
    return String(row.validation_status || row.review_status || row.status || "pending").toLowerCase();
  }

  function label(row, fields, fallback){
    for(const f of fields){
      if(row[f] !== undefined && row[f] !== null && row[f] !== "") return String(row[f]);
    }
    return fallback || "-";
  }

  function renderValidation(filter){
    const tbody = document.getElementById("validation-workflow-body");
    if(!tbody) return;

    const refs = loadValidationRecords();
    const pending = refs.filter(r => !statusOf(r.row).includes("approved") && !statusOf(r.row).includes("valid") && !statusOf(r.row).includes("reject") && !statusOf(r.row).includes("correction"));
    const approved = refs.filter(r => statusOf(r.row).includes("approved") || statusOf(r.row).includes("valid"));
    const correction = refs.filter(r => statusOf(r.row).includes("correction") || statusOf(r.row).includes("reject"));

    const p = document.getElementById("validation-pending-count");
    const a = document.getElementById("validation-approved-count");
    const c = document.getElementById("validation-correction-count");
    if(p) p.textContent = pending.length + " record(s) waiting for admin validation.";
    if(a) a.textContent = approved.length + " approved/validated record(s).";
    if(c) c.textContent = correction.length + " record(s) needing correction or rejected.";

    let list = refs;
    if(filter === "pending") list = pending;
    if(filter === "approved") list = approved;
    if(filter === "correction") list = correction;

    if(!list.length){
      tbody.innerHTML = '<tr><td colspan="6">No records found for this validation category.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map((ref, i) => {
      const row = ref.row;
      const status = label(row, ["validation_status","review_status","status"], "pending");
      return `
        <tr>
          <td>${label(row, ["id","record_id","uuid"], String(i+1))}</td>
          <td>${label(row, ["survey_name","survey","selectedSurveyName"], "-")}</td>
          <td>${label(row, ["crop_type","crop","livestock_type","commodity"], "-")}</td>
          <td>${label(row, ["collector","collector_name","created_by","owner","farmer"], "-")}</td>
          <td><strong>${status}</strong></td>
          <td>
            <div class="validation-actions">
              <button type="button" class="approve" data-v-action="approved" data-v-key="${ref.key}" data-v-index="${ref.index === null ? "" : ref.index}">Approve</button>
              <button type="button" class="correction" data-v-action="needs_correction" data-v-key="${ref.key}" data-v-index="${ref.index === null ? "" : ref.index}">Correction</button>
              <button type="button" class="reject" data-v-action="rejected" data-v-key="${ref.key}" data-v-index="${ref.index === null ? "" : ref.index}">Reject</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function bindValidation(){
    qsa("[data-validation-filter]").forEach(btn => {
      if(btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => renderValidation(btn.getAttribute("data-validation-filter")));
    });

    document.addEventListener("click", function(event){
      const btn = event.target.closest("[data-v-action]");
      if(!btn) return;

      const key = btn.getAttribute("data-v-key");
      const indexRaw = btn.getAttribute("data-v-index");
      const index = indexRaw === "" ? null : Number(indexRaw);
      const action = btn.getAttribute("data-v-action");

      const refs = loadValidationRecords();
      const ref = refs.find(r => r.key === key && ((r.index === null && index === null) || Number(r.index) === index));
      if(!ref) {
        alert("Record reference not found.");
        return;
      }

      saveRecord(ref, action);
      renderValidation();
    });

    renderValidation();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindValidation, {once:true});
  else bindValidation();
})();


/* v640: force all shapefile export buttons to call the backend ZIP endpoint */
(function(){
  "use strict";
  const API_HOST = location.hostname || "127.0.0.1";
  const isLocalApiHost = API_HOST === "localhost" || API_HOST === "127.0.0.1" || /^10\./.test(API_HOST) || /^192\.168\./.test(API_HOST) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(API_HOST);
  const API_BASE = window.CROP_COLLECTOR_API_BASE || (isLocalApiHost ? ("http://" + (API_HOST === "localhost" ? "127.0.0.1" : API_HOST) + ":8000/api/v1") : "https://crop-collector-backend.onrender.com/api/v1");

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
    showMessage("Preparing crop polygon shapefile ZIP from backend...");
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
            alert("Shapefile ZIP was not created.\n\nReason: " + error.message + "\n\nFix: approve at least one crop record with polygon geometry, confirm backend is running, then click Export Shapefile again.");
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
