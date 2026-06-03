
/* ============================================================
   COLLECTOR FINAL UI ORDER FIX v721
   Fixes v720 HierarchyRequestError.
   Professional collector layout correction.
   ============================================================ */
(function(){
  "use strict";

  if(window.__collectorFinalUiOrderFixV721Loaded) return;
  window.__collectorFinalUiOrderFixV721Loaded = true;

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function text(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim(); }
  function lower(el){ return text(el).toLowerCase(); }

  function findSurveyButton(type){
    const id = type === "crop" ? "start-crop-survey" : "start-livestock-survey";
    const action = type === "crop" ? "start-crop-survey" : "start-livestock-survey";

    const direct = document.getElementById(id) || document.querySelector('[data-action="' + action + '"]');
    if(direct) return direct;

    return qsa("#sidebar button,#collect-form button,#crop-form button").find(function(btn){
      const t = lower(btn);
      if(type === "crop") return t.includes("crop survey") || t.includes("start crop");
      return t.includes("livestock survey") || t.includes("start livestock");
    });
  }

  function isDescendant(parent, child){
    return !!(parent && child && parent !== child && parent.contains(child));
  }

  function safeMoveBefore(parent, child, reference){
    if(!parent || !child) return false;

    // Prevent: insertBefore(holder, navGroup) when navGroup is inside holder.
    if(child === parent || isDescendant(child, parent) || child === reference || isDescendant(child, reference)){
      return false;
    }

    if(reference && reference.parentElement === parent){
      parent.insertBefore(child, reference);
    }else{
      parent.appendChild(child);
    }
    return true;
  }

  function ensureSurveyButtons(){
    const collectForm = document.getElementById("collect-form");
    const cropForm = document.getElementById("crop-form");
    const parent = collectForm || cropForm || document.getElementById("sidebar");
    if(!parent) return;

    let holder = document.getElementById("collector-primary-modules");
    if(!holder){
      holder = document.createElement("div");
      holder.id = "collector-primary-modules";
      holder.className = "status";
    }

    const crop = findSurveyButton("crop");
    const livestock = findSurveyButton("livestock");

    if(crop && crop.parentElement !== holder) holder.appendChild(crop);
    if(livestock && livestock.parentElement !== holder) holder.appendChild(livestock);

    // Place holder after the Survey Name input group when possible.
    const surveyInputGroup = qsa(".input-group", parent).find(function(group){
      return lower(group).includes("survey name");
    });

    if(surveyInputGroup && surveyInputGroup.parentElement){
      const actualParent = surveyInputGroup.parentElement;
      const next = surveyInputGroup.nextSibling;
      if(holder.parentElement !== actualParent || holder.previousSibling !== surveyInputGroup){
        if(!isDescendant(holder, actualParent) && holder !== actualParent){
          actualParent.insertBefore(holder, next);
        }
      }
    }else if(!holder.parentElement){
      parent.appendChild(holder);
    }else if(holder.parentElement !== parent && !isDescendant(holder, parent)){
      parent.appendChild(holder);
    }

    holder.hidden = false;
    holder.removeAttribute("hidden");
    holder.style.display = "grid";
    holder.style.visibility = "visible";
    holder.style.opacity = "1";

    [
      [crop, "Crop Survey", "start-crop-survey"],
      [livestock, "Livestock Survey", "start-livestock-survey"]
    ].forEach(function(pair){
      const btn = pair[0];
      if(!btn) return;
      btn.id = pair[2];
      btn.hidden = false;
      btn.removeAttribute("hidden");
      btn.disabled = false;
      btn.style.display = "flex";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      btn.innerHTML = "<strong>" + pair[1] + "</strong>";
    });
  }

  function hideBackNextOnChooseScreen(){
    const form = document.getElementById("collect-form") || document.getElementById("crop-form");
    if(!form) return;

    const holder = document.getElementById("collector-primary-modules");
    const hasCrop = !!document.getElementById("start-crop-survey");
    const hasLivestock = !!document.getElementById("start-livestock-survey");

    const hasChosenModule = document.body.dataset.collectorPrimaryModule &&
      document.body.dataset.collectorPrimaryModule !== "choose";

    const chooseScreen = holder && hasCrop && hasLivestock && !hasChosenModule;

    document.body.classList.toggle("collector-choose-survey-screen", !!chooseScreen);

    qsa(".button-group", form).forEach(function(group){
      const t = lower(group);
      if(t.includes("back") && t.includes("next")){
        group.style.display = chooseScreen ? "none" : "";
      }
    });
  }

  function hideBadMessages(){
    qsa("#collector-feedback,.collector-feedback").forEach(function(el){
      const t = lower(el);
      if(t.includes("draw a point or polygon first") || t.includes("select for saving")){
        el.hidden = true;
        el.style.display = "none";
      }
    });

    qsa(".quick-menu-note,#collector-quick-menu p,#required-progress,#completion-status,#next-questions,#quality-score,.progress-card,.form-progress,.question-progress,.step-progress,.quality-card,.quality-score-card,#crop-form .step-label,#crop-form .step-summary").forEach(function(el){
      el.hidden = true;
      el.style.display = "none";
    });

    qsa("#crop-form .status,#collect-form .status,#sidebar .status").forEach(function(el){
      if(el.id === "collector-primary-modules") return;
      const t = lower(el);
      if(t.includes("main collection tools") || t.includes("required answers complete") || t.includes("needs work") || t.includes("up next:") || t.includes("setup step")){
        el.hidden = true;
        el.style.display = "none";
      }
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
        if(h2 && h2.dataset.v721OfflineBound !== "true"){
          h2.dataset.v721OfflineBound = "true";
          h2.setAttribute("role", "button");
          h2.setAttribute("tabindex", "0");
          h2.addEventListener("click", function(){ section.classList.toggle("offline-open"); });
          h2.addEventListener("keydown", function(e){
            if(e.key === "Enter" || e.key === " "){
              e.preventDefault();
              section.classList.toggle("offline-open");
            }
          });
        }
      }
    });
  }

  function showCollectForm(){
    const collectForm = document.getElementById("collect-form");
    if(collectForm){
      collectForm.hidden = false;
      collectForm.removeAttribute("hidden");
      collectForm.setAttribute("aria-hidden","false");
      collectForm.style.display = "";
      collectForm.style.visibility = "visible";
    }
  }

  function refresh(){
    try{
      document.body.classList.add("collector-final-layout");
      showCollectForm();
      ensureSurveyButtons();
      hideBackNextOnChooseScreen();
      hideBadMessages();
      classifySections();

      setTimeout(function(){
        try{
          if(window.map && window.map.invalidateSize) window.map.invalidateSize();
          if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
        }catch(error){}
      }, 80);
    }catch(error){
      console.warn("collector-final-ui-order-fix v721 recovered:", error);
    }
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
    new MutationObserver(function(){ setTimeout(refresh, 50); }).observe(sidebar, {childList:true, subtree:true, attributes:true});
  }
})();

/* v730 fallback loader */
(function(){
  if(window.__collectorFormVisibilityFixLoader) return;
  window.__collectorFormVisibilityFixLoader = true;
  if(!document.querySelector('script[src*="collector-form-visibility-fix.js"]')){
    var s = document.createElement("script");
    s.src = "collector-form-visibility-fix.js?v=730";
    document.head.appendChild(s);
  }
})();

/* v740 fallback loader */
(function(){
  if(window.__collectorSimpleFormDisplayFixLoader) return;
  window.__collectorSimpleFormDisplayFixLoader = true;
  if(!document.querySelector('script[src*="collector-simple-form-display-fix.js"]')){
    var s=document.createElement("script");
    s.src="collector-simple-form-display-fix.js?v=740";
    document.head.appendChild(s);
  }
})();
