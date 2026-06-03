
(function(){
  "use strict";

  const MAX_FIELD_QUESTIONS = 30;

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function show(el, display){
    if(!el) return;
    el.hidden = false;
    el.removeAttribute("hidden");
    el.removeAttribute("aria-hidden");
    el.style.setProperty("display", display || "block", "important");
  }
  function hide(el){
    if(!el) return;
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
  }
  function activeModule(){
    const value = document.body.dataset.collectorPrimaryModule ||
      window.activeCollectorPrimaryModule ||
      window.effectiveModule ||
      window.selectedSurveyType ||
      window.currentSurveyModule ||
      null;
    return value === "crop" || value === "livestock" ? value : null;
  }

  function syncButtonState(module){
    const crop = document.getElementById("collector-open-crop");
    const livestock = document.getElementById("collector-open-livestock");
    const label = document.getElementById("collector-module-active-label");

    if(crop){
      crop.innerHTML = "<strong>Crop Survey</strong>";
      crop.classList.toggle("active", module === "crop");
      crop.classList.toggle("secondary", module !== "crop");
      crop.setAttribute("aria-pressed", String(module === "crop"));
    }

    if(livestock){
      livestock.innerHTML = "<strong>Livestock Survey</strong>";
      livestock.classList.toggle("active", module === "livestock");
      livestock.classList.toggle("secondary", module !== "livestock");
      livestock.setAttribute("aria-pressed", String(module === "livestock"));
    }

    if(label){
      label.textContent = module === "crop" ? "Crop survey selected." :
        module === "livestock" ? "Livestock survey selected." :
        "Choose a survey type to begin.";
      show(label, "block");
    }
  }

  function setActiveModule(module){
    if(module !== "crop" && module !== "livestock") return;
    document.body.dataset.collectorPrimaryModule = module;
    window.activeCollectorPrimaryModule = module;
    window.effectiveModule = module;
    window.selectedSurveyType = module;
    window.currentSurveyModule = module;
    try{ window.CropCollectorApp?.state?.set?.("activeCollectorPrimaryModule", module); }catch(e){}
    syncButtonState(module);
  }

  function correctQuestionLabel(){
    const label = document.getElementById("collector-odk-step-label");
    if(!label) return;
    const text = String(label.textContent || "");
    const match = text.match(/(?:Question|Setup Step|Field Step)\s+(\d+)\s+of\s+(\d+)\s*:\s*(.*)/i);
    if(!match) return;

    const current = Math.min(Number(match[1]) || 1, MAX_FIELD_QUESTIONS);
    const total = Math.min(Number(match[2]) || MAX_FIELD_QUESTIONS, MAX_FIELD_QUESTIONS);
    const title = match[3] || "Field question";
    label.textContent = "Question " + current + " of " + total + ": " + title;
  }

  function enforceModuleSeparation(){
    const module = activeModule();
    if(module === "crop"){
      qsa(".livestock-main-field").forEach(hide);
      hide(document.getElementById("ministry-full-questionnaire"));
    }
    if(module === "livestock"){
      const cropOnly = [
        "crop-type","crop-variety","planted-area-ha","fertilizer-application","pest-disease-status",
        "growth-stage","crop-condition","irrigation-type","planting-date","harvest-date",
        "yield-expected","yield-tonnes","post-harvest-assessment"
      ];
      cropOnly.forEach(id => hide(document.getElementById(id)?.closest(".input-group")));
      hide(document.getElementById("collector-draw-section"));
      hide(document.getElementById("ministry-full-questionnaire"));
    }
  }

  function keepFinalSaveVisible(){
    const label = document.getElementById("collector-odk-step-label");
    const save = document.getElementById("save-entry-btn");
    if(!label || !save) return;
    const m = String(label.textContent || "").match(/Question\s+(\d+)\s+of\s+(\d+)/i);
    if(!m) return;
    if(Number(m[1]) >= Number(m[2])){
      save.innerHTML = '<i data-feather="save"></i> Save Entry';
      show(save, "flex");
    }
  }

  function stabilize(){
    syncButtonState(activeModule());
    correctQuestionLabel();
    enforceModuleSeparation();
    keepFinalSaveVisible();
  }

  document.addEventListener("click", function(event){
    if(event.target.closest("#collector-open-crop")){
      setActiveModule("crop");
      setTimeout(stabilize, 80);
      setTimeout(stabilize, 250);
    }
    if(event.target.closest("#collector-open-livestock")){
      setActiveModule("livestock");
      setTimeout(stabilize, 80);
      setTimeout(stabilize, 250);
    }
    if(event.target.closest("#collector-odk-next,#collector-odk-back,#save-entry-btn")){
      setTimeout(stabilize, 80);
      setTimeout(stabilize, 250);
    }
  }, true);

  document.addEventListener("change", function(event){
    if(event.target.closest("#survey-name,#collector-survey-name,#crop-form input,#crop-form select,#crop-form textarea")){
      setTimeout(stabilize, 80);
    }
  }, true);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", stabilize, {once:true});
  }else{
    stabilize();
  }
})();
