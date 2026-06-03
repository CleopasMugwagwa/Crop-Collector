(function(){
  "use strict";

  function moduleName(){
    const value = document.body.dataset.collectorPrimaryModule || window.activeCollectorPrimaryModule || "";
    return value === "livestock" ? "livestock" : value === "crop" ? "crop" : "";
  }

  function hasPhoto(){
    return !!String(document.getElementById("photo-data")?.value || "").trim();
  }

  function ensureHint(){
    const button = document.getElementById("photo-pick-btn");
    if(!button) return null;
    let hint = document.getElementById("collector-photo-evidence-hint");
    if(!hint){
      hint = document.createElement("div");
      hint.id = "collector-photo-evidence-hint";
      hint.className = "collector-photo-evidence-hint";
      button.closest(".button-group")?.insertAdjacentElement("afterend", hint);
    }
    return hint;
  }

  function update(){
    const button = document.getElementById("photo-pick-btn");
    const clear = document.getElementById("clear-photo-btn");
    const hint = ensureHint();
    const status = document.getElementById("mobile-photo-status");
    const module = moduleName();
    const attached = hasPhoto();

    if(button){
      button.innerHTML = attached
        ? '<i data-feather="camera"></i> Replace Field Photo'
        : '<i data-feather="camera"></i> Add Field Photo';
    }
    if(clear) clear.style.display = attached ? "flex" : "none";

    const required = module === "crop" && window.innerWidth < 900;
    const message = attached
      ? "Photo attached for this record."
      : required
        ? "Crop records need a field photo before final submission."
        : module === "livestock"
          ? "Livestock photo is recommended when available."
          : "Attach photo evidence when prompted.";

    if(hint){
      hint.textContent = message;
      hint.dataset.state = attached ? "good" : required ? "warn" : "neutral";
    }
    if(status) status.textContent = message;
    try{ feather.replace(); }catch(error){}
    window.CropCollectorFieldDashboard?.update?.();
  }

  function boot(){
    update();
    ["change","click","input"].forEach(type => {
      document.addEventListener(type, () => setTimeout(update, 100), true);
    });
    setInterval(update, 2500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  window.CropCollectorPhotoEvidencePolish = { update };
})();
