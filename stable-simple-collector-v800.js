

(function(){
  "use strict";

  if(window.__stableSimpleCollectorV800Loaded) return;
  window.__stableSimpleCollectorV800Loaded = true;

  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function hide(el){ if(el){ el.hidden = true; el.style.display = "none"; } }
  function show(el, display){ if(el){ el.hidden = false; el.removeAttribute("hidden"); el.style.display = display || ""; el.style.visibility = "visible"; el.style.opacity = "1"; } }

  function setSurveyType(type){
    window.selectedSurveyType = type;
    window.effectiveModule = type;
    document.body.dataset.collectorPrimaryModule = type;
    document.body.classList.add("module-started-v800");

    var surveyTypeField = document.getElementById("selected-survey-type") ||
                          document.querySelector('[name="selected_survey_type"],[name="survey_type"]');
    if(surveyTypeField) surveyTypeField.value = type;

    showRealForm();

    try {
      if(window.ensureCollectorSurveyReady) window.ensureCollectorSurveyReady({requestedModule:type, advance:false, silent:true});
    } catch(error) {}

    try {
      if(window.map && window.map.invalidateSize) window.map.invalidateSize();
      if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
    } catch(error) {}
  }

  function showRealForm(){
    show(document.getElementById("collect-form"), "block");
    show(document.getElementById("crop-form"), "block");

    var cropForm = document.getElementById("crop-form");
    if(!cropForm) return;

    qsa(".input-group", cropForm).forEach(function(group){
      if(group.id === "location-group" || group.querySelector("#location-name,input[type='hidden']")){
        hide(group);
      } else {
        show(group, "block");
      }
    });

    qsa("input,select,textarea,label", cropForm).forEach(function(el){
      if(el.type !== "hidden") show(el, el.tagName === "LABEL" ? "block" : "");
    });

    show(document.getElementById("save-entry-btn"), "flex");
    hide(document.getElementById("remove-shape-btn"));
    hide(document.getElementById("cancel-edit-btn"));
    hide(document.getElementById("select-polygon-btn"));
  }

  function initialView(){
    document.body.classList.remove("module-started-v800");
    show(document.getElementById("collect-form"), "block");
    show(document.getElementById("crop-form"), "block");

    var cropForm = document.getElementById("crop-form");
    if(cropForm){
      qsa(".input-group", cropForm).forEach(function(group){
        if(group.querySelector("#survey-name")) show(group, "block");
        else hide(group);
      });
    }

    hide(document.getElementById("save-entry-btn"));
    hide(document.getElementById("remove-shape-btn"));
    hide(document.getElementById("cancel-edit-btn"));
    hide(document.getElementById("select-polygon-btn"));
  }

  function bind(){
    var crop = document.getElementById("start-crop-survey-v800");
    var livestock = document.getElementById("start-livestock-survey-v800");

    if(crop && crop.dataset.boundV800 !== "true"){
      crop.dataset.boundV800 = "true";
      crop.addEventListener("click", function(){ setSurveyType("crop"); }, false);
    }

    if(livestock && livestock.dataset.boundV800 !== "true"){
      livestock.dataset.boundV800 = "true";
      livestock.addEventListener("click", function(){ setSurveyType("livestock"); }, false);
    }

    var offlineHeader = qsa("#sidebar .section h2").find(function(h){
      return /offline|basemap|mbtiles/i.test(h.textContent || "");
    });
    if(offlineHeader && offlineHeader.dataset.boundV800 !== "true"){
      offlineHeader.dataset.boundV800 = "true";
      offlineHeader.addEventListener("click", function(){
        offlineHeader.closest(".section")?.classList.toggle("offline-open");
      });
    }
  }

  function removeBlockingUi(){
    hide(document.getElementById("collector-quick-menu"));
    qsa("#collector-feedback,.collector-feedback,#save-flow-card,.save-flow-card,#geometry-edit-status,#save-action-stack,.save-action-stack,.quick-menu-note,#required-progress,#completion-status,#next-questions,#quality-score,.progress-card,.form-progress,.question-progress,.step-progress,.quality-card,.quality-score-card").forEach(hide);
  }

  function boot(){
    document.body.classList.add("collector-final-layout");
    removeBlockingUi();
    bind();
    initialView();
  }

  // Suppress old runtime boxes caused by removed patch scripts.
  window.addEventListener("error", function(event){
    if(String(event.message || "").includes("insertAdjacentElement") ||
       String(event.message || "").includes("HierarchyRequestError")){
      event.preventDefault();
      removeBlockingUi();
      return true;
    }
  }, true);

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  setTimeout(boot, 300);
  setTimeout(boot, 900);
})();

