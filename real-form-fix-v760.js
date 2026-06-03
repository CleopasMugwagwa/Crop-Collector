

(function(){
  "use strict";

  if(window.__realFormFixV760Loaded) return;
  window.__realFormFixV760Loaded = true;

  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function text(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim(); }
  function lower(el){ return text(el).toLowerCase(); }

  function hide(el){
    if(!el) return;
    el.hidden = true;
    el.style.display = "none";
  }

  function show(el, display){
    if(!el) return;
    el.hidden = false;
    el.removeAttribute("hidden");
    el.removeAttribute("aria-hidden");
    el.style.display = display || "";
    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.style.height = "";
    el.style.maxHeight = "";
    el.style.overflow = "";
  }

  function getSurveyGroup(){
    return qsa("#crop-form .input-group").find(function(group){
      return group.querySelector("#survey-name,[name='survey_name']") || lower(group).includes("survey name");
    });
  }

  function installModuleButtons(){
    var cropForm = document.getElementById("crop-form");
    if(!cropForm) return;

    // Do not move old dynamic holders. Remove them safely if they are not our final holder.
    qsa("#collector-primary-modules").forEach(function(old){
      if(old.id !== "collector-primary-modules-v760") hide(old);
    });

    var holder = document.getElementById("collector-primary-modules-v760");
    if(!holder){
      holder = document.createElement("div");
      holder.id = "collector-primary-modules-v760";
      holder.innerHTML =
        '<button type="button" id="start-crop-survey-v760"><strong>Crop Survey</strong></button>' +
        '<button type="button" id="start-livestock-survey-v760"><strong>Livestock Survey</strong></button>';
    }

    var surveyGroup = getSurveyGroup();
    if(surveyGroup && holder.parentElement !== cropForm){
      cropForm.insertBefore(holder, surveyGroup.nextSibling);
    }else if(!holder.parentElement){
      cropForm.insertBefore(holder, cropForm.firstChild);
    }

    show(holder, "grid");

    var cropBtn = document.getElementById("start-crop-survey-v760");
    var livestockBtn = document.getElementById("start-livestock-survey-v760");

    if(cropBtn && cropBtn.dataset.boundV760 !== "true"){
      cropBtn.dataset.boundV760 = "true";
      cropBtn.addEventListener("click", function(){ startModule("crop"); }, false);
    }

    if(livestockBtn && livestockBtn.dataset.boundV760 !== "true"){
      livestockBtn.dataset.boundV760 = "true";
      livestockBtn.addEventListener("click", function(){ startModule("livestock"); }, false);
    }
  }

  function startModule(module){
    document.body.classList.add("module-started-v760");
    document.body.dataset.collectorPrimaryModule = module || "crop";

    var oldBtn = module === "livestock"
      ? (document.getElementById("start-livestock-survey") || document.querySelector("[data-action='start-livestock-survey']"))
      : (document.getElementById("start-crop-survey") || document.querySelector("[data-action='start-crop-survey']"));

    // Trigger original app logic if it exists, but don't depend on it.
    if(oldBtn && oldBtn.click && !oldBtn.dataset.clickedByV760){
      oldBtn.dataset.clickedByV760 = "true";
      try{ oldBtn.click(); }catch(error){}
      setTimeout(function(){ oldBtn.dataset.clickedByV760 = ""; }, 300);
    }

    showRealFields();
  }

  function showRealFields(){
    var collectForm = document.getElementById("collect-form");
    var cropForm = document.getElementById("crop-form");

    show(collectForm, "block");
    show(cropForm, "block");

    if(cropForm){
      qsa(".input-group", cropForm).forEach(function(group){
        var isLocation = group.id === "location-group" || group.querySelector("#location-name,input[type='hidden']");
        if(isLocation){
          hide(group);
          return;
        }
        show(group, "block");
      });

      qsa("input,select,textarea,label", cropForm).forEach(function(el){
        if(el.type === "hidden") return;
        show(el, el.tagName === "LABEL" ? "block" : "");
      });

      show(document.getElementById("save-entry-btn"), "flex");
      hide(document.getElementById("remove-shape-btn"));
      hide(document.getElementById("cancel-edit-btn"));
      hide(document.getElementById("select-polygon-btn"));
    }
  }

  function initialChooseState(){
    var cropForm = document.getElementById("crop-form");
    if(!cropForm || document.body.classList.contains("module-started-v760")) return;

    show(document.getElementById("collect-form"), "block");
    show(cropForm, "block");

    qsa(".input-group", cropForm).forEach(function(group){
      var isSurvey = group.querySelector("#survey-name,[name='survey_name']") || lower(group).includes("survey name");
      if(isSurvey){
        group.classList.add("survey-name-visible-v760");
        show(group, "block");
      }else{
        hide(group);
      }
    });

    hide(document.getElementById("save-entry-btn"));
    hide(document.getElementById("remove-shape-btn"));
    hide(document.getElementById("cancel-edit-btn"));
    hide(document.getElementById("select-polygon-btn"));
  }

  function removeBlockingUi(){
    hide(document.getElementById("collector-quick-menu"));

    qsa("#collector-feedback,.collector-feedback,#save-flow-card,.save-flow-card,#geometry-edit-status,#save-action-stack,.save-action-stack,.quick-menu-note,#required-progress,#completion-status,#next-questions,#quality-score,.progress-card,.form-progress,.question-progress,.step-progress,.quality-card,.quality-score-card,#crop-form .step-label,#crop-form .step-summary").forEach(hide);

    qsa("#sidebar .section").forEach(function(section){
      var title = lower(section.querySelector("h2"));
      var isOffline = title.includes("offline") || title.includes("basemap") || title.includes("mbtiles");
      var isSync = title.includes("offline save") || title.includes("sync");
      var hideSection = title.includes("entries") || title.includes("settings") || title.includes("operations") || title.includes("field readiness") || isSync;

      section.classList.toggle("offline-final-v760", isOffline && !isSync);

      if(hideSection && !(isOffline && !isSync)){
        section.classList.add("hide-in-collector-final");
      }

      if(isOffline && !isSync){
        var h2 = section.querySelector("h2");
        if(h2 && h2.dataset.v760Bound !== "true"){
          h2.dataset.v760Bound = "true";
          h2.addEventListener("click", function(){ section.classList.toggle("offline-open"); });
        }
      }
    });
  }

  function repair(){
    document.body.classList.add("collector-final-layout");
    removeBlockingUi();
    installModuleButtons();

    if(document.body.classList.contains("module-started-v760")){
      showRealFields();
    }else{
      initialChooseState();
    }

    setTimeout(function(){
      try{
        if(window.map && window.map.invalidateSize) window.map.invalidateSize();
        if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
      }catch(error){}
    }, 100);
  }

  // Hide old patch errors from UI and console.
  var originalWarn = console.warn;
  console.warn = function(){
    try{
      var msg = Array.from(arguments).join(" ");
      if(msg.includes("collector-form-visibility-fix") ||
         msg.includes("collector-simple-form-display-fix") ||
         msg.includes("HierarchyRequestError")){
        return;
      }
    }catch(error){}
    return originalWarn.apply(console, arguments);
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", repair, {once:true});
  }else{
    repair();
  }

  setTimeout(repair, 300);
  setTimeout(repair, 900);
  setTimeout(repair, 1800);
  setInterval(repair, 3000);

  var sidebar = document.getElementById("sidebar");
  if(sidebar){
    new MutationObserver(function(){ setTimeout(repair, 60); }).observe(sidebar, {childList:true, subtree:true, attributes:true});
  }
})();

