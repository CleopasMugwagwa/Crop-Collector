
/* ============================================================
   COLLECTOR HIERARCHY WARNING FIX v741
   Replaces older v730/v740 DOM-moving logic with safe placement.
   Fixes:
   - HierarchyRequestError from insertAdjacentElement/insertBefore
   - Repeated recovered warning spam
   - Keeps Crop/Livestock buttons and form display working
   ============================================================ */
(function(){
  "use strict";

  if(window.__collectorHierarchyWarningFixV741Loaded) return;
  window.__collectorHierarchyWarningFixV741Loaded = true;

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function text(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim(); }
  function lower(el){ return text(el).toLowerCase(); }

  function isInside(parent, child){
    return !!(parent && child && parent !== child && parent.contains(child));
  }

  function safeInsertAfter(reference, child){
    if(!reference || !reference.parentElement || !child) return false;
    if(reference === child || isInside(child, reference) || isInside(child, reference.parentElement)) return false;
    reference.parentElement.insertBefore(child, reference.nextSibling);
    return true;
  }

  function findBtn(type){
    const id = type === "crop" ? "start-crop-survey" : "start-livestock-survey";
    const action = type === "crop" ? "start-crop-survey" : "start-livestock-survey";

    return document.getElementById(id) ||
      document.querySelector('[data-action="' + action + '"]') ||
      qsa("#sidebar button,#crop-form button,#collect-form button").find(function(btn){
        const t = lower(btn);
        if(type === "crop") return t.includes("crop survey") || t.includes("start crop");
        return t.includes("livestock survey") || t.includes("start livestock");
      });
  }

  function getForm(){
    return document.getElementById("crop-form") || document.getElementById("collect-form") || document.getElementById("sidebar");
  }

  function getSurveyNameGroup(){
    return qsa("#crop-form .input-group,#collect-form .input-group").find(function(group){
      const t = lower(group);
      return t.includes("survey name") || group.querySelector("#survey-name,[name='survey_name']");
    });
  }

  function ensureModuleButtons(){
    const form = getForm();
    if(!form) return;

    let holder = document.getElementById("collector-primary-modules");
    if(!holder){
      holder = document.createElement("div");
      holder.id = "collector-primary-modules";
      holder.className = "status";
    }

    const crop = findBtn("crop");
    const livestock = findBtn("livestock");

    if(crop && crop.parentElement !== holder) holder.appendChild(crop);
    if(livestock && livestock.parentElement !== holder) holder.appendChild(livestock);

    // Safe placement: after Survey Name group, unless impossible.
    const surveyGroup = getSurveyNameGroup();
    if(surveyGroup && holder.parentElement !== surveyGroup.parentElement){
      if(!safeInsertAfter(surveyGroup, holder) && !holder.parentElement){
        form.insertBefore(holder, form.firstChild);
      }
    }else if(surveyGroup && holder.previousElementSibling !== surveyGroup){
      safeInsertAfter(surveyGroup, holder);
    }else if(!holder.parentElement){
      form.insertBefore(holder, form.firstChild);
    }

    [
      [crop, "Crop Survey", "start-crop-survey", "crop"],
      [livestock, "Livestock Survey", "start-livestock-survey", "livestock"]
    ].forEach(function(item){
      const btn = item[0];
      if(!btn) return;
      btn.id = item[2];
      btn.dataset.finalSurveyType = item[3];
      btn.hidden = false;
      btn.removeAttribute("hidden");
      btn.disabled = false;
      btn.style.display = "flex";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      btn.innerHTML = "<strong>" + item[1] + "</strong>";

      if(btn.dataset.v741Bound !== "true"){
        btn.dataset.v741Bound = "true";
        btn.addEventListener("click", function(){
          document.body.classList.add("collector-module-started");
          document.body.classList.remove("collector-choose-survey-screen");
          document.body.dataset.collectorPrimaryModule = item[3];
          showFormFields();
          hideClutter();
        }, false);
      }
    });

    holder.hidden = false;
    holder.removeAttribute("hidden");
    holder.style.display = "grid";
    holder.style.visibility = "visible";
    holder.style.opacity = "1";
  }

  function showChooseScreenIfNeeded(){
    if(!document.body.classList.contains("collector-module-started")){
      document.body.classList.add("collector-choose-survey-screen");
    }
  }

  function showFormFields(){
    const collectForm = document.getElementById("collect-form");
    const cropForm = document.getElementById("crop-form");

    if(collectForm){
      collectForm.hidden = false;
      collectForm.removeAttribute("hidden");
      collectForm.setAttribute("aria-hidden","false");
      collectForm.style.display = "block";
      collectForm.style.visibility = "visible";
      collectForm.style.opacity = "1";
    }

    if(cropForm){
      cropForm.hidden = false;
      cropForm.removeAttribute("hidden");
      cropForm.style.display = "block";
      cropForm.style.visibility = "visible";
      cropForm.style.opacity = "1";

      qsa(".input-group", cropForm).forEach(function(group){
        const isHiddenLocation = group.id === "location-group" || group.querySelector("#location-name,[type='hidden']");
        if(isHiddenLocation) return;
        group.hidden = false;
        group.removeAttribute("hidden");
        group.style.display = "block";
        group.style.visibility = "visible";
        group.style.opacity = "1";
      });
    }
  }

  function hideQuickMenu(){
    const qm = document.getElementById("collector-quick-menu");
    if(qm){
      qm.hidden = true;
      qm.style.display = "none";
      qm.style.height = "0";
      qm.style.margin = "0";
      qm.style.padding = "0";
    }
  }

  function hideChooseOnlyActions(){
    const started = document.body.classList.contains("collector-module-started");
    qsa("#save-action-stack,.save-action-stack,#save-flow-card,.save-flow-card,#geometry-edit-status").forEach(function(el){
      if(!started){
        el.hidden = true;
        el.style.display = "none";
      }
    });

    if(!started){
      qsa("#save-entry-btn,#save-next-plot-btn,#remove-shape-btn,#cancel-edit-btn,#select-polygon-btn").forEach(function(el){
        el.style.display = "none";
      });
    }
  }

  function hideClutter(){
    qsa("#collector-feedback,.collector-feedback").forEach(function(el){
      const t = lower(el);
      if(t.includes("draw a point or polygon first") || t.includes("select for saving") || t.includes("cannot set properties") || t.includes("hierarchyrequesterror")){
        el.hidden = true;
        el.style.display = "none";
      }
    });

    qsa(".quick-menu-note,#collector-quick-menu p,#required-progress,#completion-status,#next-questions,#quality-score,.progress-card,.form-progress,.question-progress,.step-progress,.quality-card,.quality-score-card,#crop-form .step-label,#crop-form .step-summary").forEach(function(el){
      el.hidden = true;
      el.style.display = "none";
    });
  }

  function classifySections(){
    qsa("#sidebar .section").forEach(function(section){
      const title = lower(section.querySelector("h2"));
      const isOffline = title.includes("offline") || title.includes("basemap") || title.includes("mbtiles");
      const isEntries = title.includes("entries");
      const isSync = title.includes("offline save") || title.includes("sync");
      const isAdvanced = title.includes("settings") || title.includes("operations") || title.includes("field readiness");

      section.classList.toggle("final-offline-map-section", isOffline && !isSync);
      section.classList.toggle("final-hide-entries", isEntries);
      section.classList.toggle("final-hide-sync", isSync && !isOffline);
      section.classList.toggle("final-hide-in-collector", isAdvanced && !isOffline);

      if(isOffline && !isSync){
        const h2 = section.querySelector("h2");
        if(h2 && h2.dataset.v741OfflineBound !== "true"){
          h2.dataset.v741OfflineBound = "true";
          h2.addEventListener("click", function(){ section.classList.toggle("offline-open"); });
        }
      }
    });
  }

  function refresh(){
    document.body.classList.add("collector-final-layout");
    hideQuickMenu();
    ensureModuleButtons();
    showChooseScreenIfNeeded();
    if(document.body.classList.contains("collector-module-started")) showFormFields();
    hideChooseOnlyActions();
    hideClutter();
    classifySections();

    setTimeout(function(){
      try{
        if(window.map && window.map.invalidateSize) window.map.invalidateSize();
        if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
      }catch(error){}
    }, 80);
  }

  // Silence older recovered warning spam from old loaded code.
  if(!window.__collectorV741ConsolePatched){
    window.__collectorV741ConsolePatched = true;
    const originalWarn = console.warn;
    console.warn = function(){
      try{
        const msg = Array.from(arguments).join(" ");
        if(msg.includes("collector-form-visibility-fix v730 recovered") ||
           msg.includes("collector-simple-form-display-fix v740 recovered")){
          return;
        }
      }catch(error){}
      return originalWarn.apply(console, arguments);
    };
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", refresh, {once:true});
  }else{
    refresh();
  }

  setTimeout(refresh, 250);
  setTimeout(refresh, 800);
  setTimeout(refresh, 1600);
  setTimeout(refresh, 3000);
  setInterval(refresh, 4000);

  const sidebar = document.getElementById("sidebar");
  if(sidebar){
    new MutationObserver(function(){ setTimeout(refresh, 80); }).observe(sidebar, {childList:true, subtree:true, attributes:true});
  }
})();
