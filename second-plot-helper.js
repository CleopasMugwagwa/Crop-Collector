
(function(){
  "use strict";

  const CONTEXT_KEY = "crop_collector_last_farmer_context_v620";

  const COPY_KEYWORDS = [
    "farmer","owner","contact","phone","province","district","ward","aez",
    "sector","village","farm","household","respondent","name","address",
    "national_id","id_number","aeo"
  ];

  const PLOT_KEYWORDS = [
    "plot","crop","livestock","area","condition","growth","planting","germination",
    "geometry","boundary","latitude","longitude","photo","notes","yield","variety"
  ];

  function shouldCopy(name){
    const n = String(name || "").toLowerCase();
    if(!n) return false;
    if(PLOT_KEYWORDS.some(k => n.includes(k))) return false;
    return COPY_KEYWORDS.some(k => n.includes(k));
  }

  function getForm(){
    return document.getElementById("crop-form");
  }

  function collectContext(){
    const form = getForm();
    if(!form) return {};
    const data = {};
    form.querySelectorAll("input,select,textarea").forEach(el => {
      const name = el.name || el.id;
      if(!shouldCopy(name)) return;
      if(el.type === "file" || el.type === "password") return;
      if((el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      data[name] = el.value;
    });
    return data;
  }

  function saveContext(){
    const data = collectContext();
    localStorage.setItem(CONTEXT_KEY, JSON.stringify({saved_at:new Date().toISOString(), data}));
    updateStatus("Previous farmer details saved for the next plot.");
  }

  function applyContext(){
    const form = getForm();
    if(!form) return updateStatus("Crop form not found yet.");
    let payload = null;
    try{ payload = JSON.parse(localStorage.getItem(CONTEXT_KEY) || "null"); }catch(error){}
    if(!payload || !payload.data) return updateStatus("No previous farmer details found.");

    Object.entries(payload.data).forEach(([name,value]) => {
      const el = form.querySelector(`[name="${CSS.escape(name)}"],#${CSS.escape(name)}`);
      if(el && !el.disabled && el.type !== "file"){
        el.value = value;
        el.dispatchEvent(new Event("input", {bubbles:true}));
        el.dispatchEvent(new Event("change", {bubbles:true}));
      }
    });
    updateStatus("Previous farmer details copied. Now draw/fill the new plot-specific details.");
  }

  function clearContext(){
    localStorage.removeItem(CONTEXT_KEY);
    updateStatus("Previous farmer details cleared.");
  }

  function updateStatus(message){
    const el = document.getElementById("second-plot-helper-status");
    if(el) el.textContent = message;
  }

  function installPanel(){
    if(document.getElementById("second-plot-helper")) return;
    const collectForm = document.getElementById("collect-form") || document.getElementById("sidebar") || document.body;
    const panel = document.createElement("details");
    panel.id = "second-plot-helper";
    panel.className = "second-plot-helper";
    panel.open = false;
    panel.innerHTML = `
      <summary>Second Plot / Same Farmer Helper</summary>
      <div class="second-plot-helper-body">
        <div>
          For a second plot belonging to the same farmer, do not repeat all household/farmer details.
          Copy the previous farmer details, then fill only the new plot-specific information such as crop,
          boundary, area, condition, growth stage and notes.
        </div>
        <div class="second-plot-helper-actions">
          <button type="button" id="use-previous-farmer-btn">Use Previous Farmer Details</button>
          <button type="button" id="clear-previous-farmer-btn">Clear Saved Farmer</button>
        </div>
        <div id="second-plot-helper-status" style="margin-top:.7rem;color:#14532d;font-weight:700;">Ready.</div>
      </div>
    `;
    collectForm.appendChild(panel);

    document.getElementById("use-previous-farmer-btn")?.addEventListener("click", applyContext);
    document.getElementById("clear-previous-farmer-btn")?.addEventListener("click", clearContext);
  }

  function bindSaveCapture(){
    const form = getForm();
    if(!form || form.dataset.secondPlotHelperPatched === "true") return;
    form.dataset.secondPlotHelperPatched = "true";
    form.addEventListener("submit", function(){
      saveContext();
    }, true);
  }

  function boot(){
    installPanel();
    bindSaveCapture();
    setTimeout(bindSaveCapture, 1000);
    setTimeout(installPanel, 1500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
