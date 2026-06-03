
/* ============================================================
   RESTORE COLLECTOR FORM + SURVEY BUTTONS v700
   Fixes missing Crop/Livestock and missing form display.
   ============================================================ */
(function(){
  "use strict";

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function text(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase(); }

  function findButton(kind){
    const id = kind === "crop" ? "start-crop-survey" : "start-livestock-survey";
    const action = kind === "crop" ? "start-crop-survey" : "start-livestock-survey";
    const direct = document.getElementById(id) || document.querySelector('[data-action="' + action + '"]');
    if(direct) return direct;

    return qsa("#sidebar button,#collect-form button").find(function(btn){
      const t = text(btn);
      if(kind === "crop") return t.includes("crop survey") || t.includes("start crop") || t === "crop";
      return t.includes("livestock survey") || t.includes("start livestock") || t === "livestock";
    });
  }

  function ensurePrimaryModules(){
    const collectForm = document.getElementById("collect-form");
    const cropForm = document.getElementById("crop-form");
    const startHeading = document.getElementById("collect-form-heading") || (collectForm && collectForm.querySelector("h2,h3"));

    if(!collectForm && !cropForm) return;

    let holder = document.getElementById("collector-primary-modules");
    if(!holder){
      holder = document.createElement("div");
      holder.id = "collector-primary-modules";
      holder.className = "status";
      if(startHeading && startHeading.parentElement){
        startHeading.insertAdjacentElement("afterend", holder);
      }else if(collectForm){
        collectForm.prepend(holder);
      }else if(cropForm){
        cropForm.parentElement.insertBefore(holder, cropForm);
      }
    }

    holder.hidden = false;
    holder.removeAttribute("hidden");
    holder.style.display = "grid";
    holder.style.visibility = "visible";
    holder.style.opacity = "1";

    const crop = findButton("crop");
    const livestock = findButton("livestock");

    if(crop && crop.parentElement !== holder) holder.appendChild(crop);
    if(livestock && livestock.parentElement !== holder) holder.appendChild(livestock);

    [
      [crop, "Crop Survey", "start-crop-survey"],
      [livestock, "Livestock Survey", "start-livestock-survey"]
    ].forEach(function(pair){
      const btn = pair[0];
      if(!btn) return;
      btn.id = btn.id || pair[2];
      btn.hidden = false;
      btn.removeAttribute("hidden");
      btn.disabled = false;
      btn.style.display = "flex";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      if(!btn.dataset.v700Labelled){
        btn.innerHTML = "<strong>" + pair[1] + "</strong>";
        btn.dataset.v700Labelled = "true";
      }
    });
  }

  function showCollectForm(){
    const collectForm = document.getElementById("collect-form");
    const cropForm = document.getElementById("crop-form");
    const heading = document.getElementById("collect-form-heading");

    if(collectForm){
      collectForm.hidden = false;
      collectForm.removeAttribute("hidden");
      collectForm.setAttribute("aria-hidden", "false");
      collectForm.style.display = "block";
      collectForm.style.visibility = "visible";
      collectForm.style.opacity = "1";
    }

    if(heading){
      heading.hidden = false;
      heading.removeAttribute("hidden");
      heading.style.display = "flex";
      heading.style.visibility = "visible";
    }

    if(cropForm){
      cropForm.hidden = false;
      cropForm.removeAttribute("hidden");
      cropForm.style.visibility = "visible";
      cropForm.style.opacity = "1";
    }
  }

  function restoreActiveQuestion(){
    const cropForm = document.getElementById("crop-form");
    if(!cropForm) return;

    const active = cropForm.querySelector(".odk-question-active,.odk-section-active");
    if(active){
      active.hidden = false;
      active.removeAttribute("hidden");
      active.style.display = "block";
      active.style.visibility = "visible";
      active.style.opacity = "1";
    }

    // If there is no active question but form has real fields, show the first real input group.
    if(!active){
      const firstInputGroup = cropForm.querySelector(".input-group");
      if(firstInputGroup){
        firstInputGroup.hidden = false;
        firstInputGroup.removeAttribute("hidden");
        firstInputGroup.style.display = "block";
        firstInputGroup.style.visibility = "visible";
      }
    }

    qsa(".input-group", cropForm).forEach(function(group){
      if(group.querySelector("input,select,textarea")){
        group.style.visibility = "visible";
        group.style.opacity = "1";
      }
    });
  }

  function removeOnlyBadStatusText(){
    const bad = [
      "main collection tools stay up front",
      "required answers complete",
      "needs work",
      "up next:",
      "setup step"
    ];

    qsa(".quick-menu-note,#collector-quick-menu p,#required-progress,#completion-status,#next-questions,#quality-score,.progress-card,.form-progress,.question-progress,.step-progress,.quality-card,.quality-score-card,#crop-form .step-label,#crop-form .step-summary").forEach(function(el){
      el.hidden = true;
      el.style.display = "none";
    });

    qsa("#crop-form .status,#sidebar .status").forEach(function(el){
      const t = text(el);
      if(bad.some(function(phrase){ return t.includes(phrase); })){
        el.hidden = true;
        el.style.display = "none";
      }
    });
  }

  function keepOfflineCollapsed(){
    qsa("#sidebar .section").forEach(function(section){
      const h = section.querySelector("h2");
      const title = text(h);
      const offline = title.includes("offline") || title.includes("basemap") || title.includes("mbtiles");
      const advanced = title.includes("settings") || title.includes("operations") || title.includes("field readiness");

      section.classList.toggle("final-offline-map-section", offline);
      section.classList.toggle("final-hide-in-collector", advanced && !offline);

      if(offline && h && h.dataset.v700OfflineBound !== "true"){
        h.dataset.v700OfflineBound = "true";
        h.addEventListener("click", function(){ section.classList.toggle("offline-open"); });
      }
    });
  }

  function refresh(){
    document.body.classList.add("collector-final-layout");
    showCollectForm();
    ensurePrimaryModules();
    restoreActiveQuestion();
    removeOnlyBadStatusText();
    keepOfflineCollapsed();

    setTimeout(function(){
      try{
        if(window.map && window.map.invalidateSize) window.map.invalidateSize();
        if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
      }catch(error){}
    }, 100);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", refresh, {once:true});
  }else{
    refresh();
  }

  setTimeout(refresh, 300);
  setTimeout(refresh, 900);
  setTimeout(refresh, 1800);
  setInterval(refresh, 3500);

  const sidebar = document.getElementById("sidebar");
  if(sidebar){
    new MutationObserver(function(){ setTimeout(refresh, 50); }).observe(sidebar, {childList:true, subtree:true, attributes:true});
  }
})();

/* v720 fallback loader */
(function(){
  if(window.__collectorFinalUiOrderFixLoader) return;
  window.__collectorFinalUiOrderFixLoader = true;
  if(!document.querySelector('script[src*="collector-final-ui-order-fix.js"]')){
    var s = document.createElement("script");
    s.src = "collector-final-ui-order-fix.js?v=721";
    document.head.appendChild(s);
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
