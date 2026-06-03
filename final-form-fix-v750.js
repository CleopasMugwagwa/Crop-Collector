

(function(){
  "use strict";

  if(window.__finalFormFixV750Loaded) return;
  window.__finalFormFixV750Loaded = true;

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function text(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim(); }
  function lower(el){ return text(el).toLowerCase(); }

  function hide(el){
    if(!el) return;
    el.hidden = true;
    el.style.display = "none";
    el.style.visibility = "hidden";
    el.style.height = "0";
    el.style.margin = "0";
    el.style.padding = "0";
    el.style.overflow = "hidden";
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

  function findButton(type){
    var id = type === "crop" ? "start-crop-survey" : "start-livestock-survey";
    var action = type === "crop" ? "start-crop-survey" : "start-livestock-survey";

    return document.getElementById(id) ||
      document.querySelector('[data-action="' + action + '"]') ||
      qsa("#sidebar button,#collect-form button,#crop-form button").find(function(btn){
        var t = lower(btn);
        return type === "crop"
          ? (t.includes("crop survey") || t.includes("start crop"))
          : (t.includes("livestock survey") || t.includes("start livestock"));
      });
  }

  function getSurveyGroup(){
    return qsa("#crop-form .input-group,#collect-form .input-group").find(function(group){
      return lower(group).includes("survey name") || group.querySelector("#survey-name,[name='survey_name']");
    });
  }

  function ensureModuleButtons(){
    var cropForm = document.getElementById("crop-form");
    var collectForm = document.getElementById("collect-form");
    var form = cropForm || collectForm;
    if(!form) return;

    var holder = document.getElementById("collector-primary-modules");
    if(!holder){
      holder = document.createElement("div");
      holder.id = "collector-primary-modules";
      holder.className = "status";
    }

    var crop = findButton("crop");
    var livestock = findButton("livestock");

    if(!crop){
      crop = document.createElement("button");
      crop.type = "button";
      crop.id = "start-crop-survey";
    }

    if(!livestock){
      livestock = document.createElement("button");
      livestock.type = "button";
      livestock.id = "start-livestock-survey";
    }

    crop.innerHTML = "<strong>Crop Survey</strong>";
    livestock.innerHTML = "<strong>Livestock Survey</strong>";

    if(crop.parentElement !== holder) holder.appendChild(crop);
    if(livestock.parentElement !== holder) holder.appendChild(livestock);

    var surveyGroup = getSurveyGroup();
    if(surveyGroup && surveyGroup.parentElement && holder.parentElement !== surveyGroup.parentElement){
      surveyGroup.insertAdjacentElement("afterend", holder);
    }else if(surveyGroup && holder.previousElementSibling !== surveyGroup){
      surveyGroup.insertAdjacentElement("afterend", holder);
    }else if(!holder.parentElement){
      form.insertBefore(holder, form.firstChild);
    }

    show(holder, "grid");
    show(crop, "flex");
    show(livestock, "flex");

    if(crop.dataset.v750Bound !== "true"){
      crop.dataset.v750Bound = "true";
      crop.addEventListener("click", function(){ startForm("crop"); }, false);
    }
    if(livestock.dataset.v750Bound !== "true"){
      livestock.dataset.v750Bound = "true";
      livestock.addEventListener("click", function(){ startForm("livestock"); }, false);
    }
  }

  function startForm(module){
    document.body.classList.add("collector-module-started");
    document.body.classList.remove("collector-choose-survey-screen");
    document.body.dataset.collectorPrimaryModule = module || "crop";
    showActualForm();
  }

  function showActualForm(){
    var collectForm = document.getElementById("collect-form");
    var cropForm = document.getElementById("crop-form");

    show(collectForm, "block");
    show(cropForm, "block");

    if(cropForm){
      qsa(".input-group", cropForm).forEach(function(group){
        var isLocation = group.id === "location-group" || group.querySelector("#location-name,input[type='hidden']");
        if(isLocation) {
          hide(group);
          return;
        }
        show(group, "block");
      });

      qsa("input,select,textarea,label", cropForm).forEach(function(el){
        if(el.type === "hidden") return;
        show(el, el.tagName === "LABEL" ? "block" : "");
      });

      var save = document.getElementById("save-entry-btn");
      if(save && save.parentElement !== cropForm) cropForm.appendChild(save);
      show(save, "flex");

      ["remove-shape-btn","cancel-edit-btn","select-polygon-btn"].forEach(function(id){
        hide(document.getElementById(id));
      });
    }
  }

  function removeConflictingUi(){
    hide(document.getElementById("collector-quick-menu"));

    qsa(".quick-menu-note,#collector-quick-menu p,#required-progress,#completion-status,#next-questions,#quality-score,#wizard-progress,#collector-progress,#form-progress,.progress-card,.form-progress,.setup-progress,.question-progress,.step-progress,.quality-card,.quality-score-card,#crop-form .step-label,#crop-form .step-summary,#crop-form .setup-step,#crop-form .question-step,#save-flow-card,.save-flow-card,#geometry-edit-status,#save-action-stack,.save-action-stack").forEach(hide);

    qsa("#collector-feedback,.collector-feedback").forEach(function(el){
      var t = lower(el);
      if(t.includes("draw a point or polygon first") ||
         t.includes("select for saving") ||
         t.includes("continue through the record") ||
         t.includes("complete crop type") ||
         t.includes("cannot set properties") ||
         t.includes("hierarchyrequesterror")){
        hide(el);
      }
    });
  }

  function classifySections(){
    qsa("#sidebar .section").forEach(function(section){
      var title = lower(section.querySelector("h2"));
      var isOffline = title.includes("offline") || title.includes("basemap") || title.includes("mbtiles");
      var isEntries = title.includes("entries");
      var isSync = title.includes("offline save") || title.includes("sync");
      var isAdvanced = title.includes("settings") || title.includes("operations") || title.includes("field readiness");

      section.classList.toggle("final-offline-map-section", isOffline && !isSync);
      section.classList.toggle("final-hide-entries", isEntries);
      section.classList.toggle("final-hide-sync", isSync && !isOffline);
      section.classList.toggle("final-hide-in-collector", isAdvanced && !isOffline);

      if(isOffline && !isSync){
        var h2 = section.querySelector("h2");
        if(h2 && h2.dataset.v750OfflineBound !== "true"){
          h2.dataset.v750OfflineBound = "true";
          h2.addEventListener("click", function(){
            section.classList.toggle("offline-open");
          });
        }
      }
    });
  }

  function repair(){
    document.body.classList.add("collector-final-layout");
    removeConflictingUi();
    ensureModuleButtons();

    if(document.body.classList.contains("collector-module-started")){
      showActualForm();
    }else{
      // On first load, keep survey choice clean but do not show all questions until user clicks.
      document.body.classList.add("collector-choose-survey-screen");
      var cropForm = document.getElementById("crop-form");
      if(cropForm){
        qsa(".input-group", cropForm).forEach(function(group){
          var isSurvey = lower(group).includes("survey name") || group.querySelector("#survey-name,[name='survey_name']");
          if(isSurvey) show(group, "block");
          else hide(group);
        });
        hide(document.getElementById("save-entry-btn"));
      }
    }

    classifySections();

    setTimeout(function(){
      try{
        if(window.map && window.map.invalidateSize) window.map.invalidateSize();
        if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
      }catch(error){}
    }, 80);
  }

  // Silence old patch noise that is not useful anymore.
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

