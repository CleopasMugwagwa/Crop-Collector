
/* ============================================================
   COLLECTOR FINAL LAYOUT v1
   Minimal architecture cleanup only.
   No field question changes. No new buttons. No drawing-tool changes.
   ============================================================ */
(function(){
  function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }

  function titleOf(section){
    const h2 = section ? section.querySelector("h2") : null;
    return h2 ? h2.textContent.trim().toLowerCase() : "";
  }

  function hideFromCollector(title){
    return (
      title.includes("quick menu") ||
      title.includes("settings") ||
      title.includes("entries") ||
      title.includes("operations") ||
      title.includes("field readiness")
    );
  }

  function isOfflineMapSection(title){
    return title.includes("offline") || title.includes("basemap");
  }

  function applyFinalLayout(){
    document.body.classList.add("collector-final-layout");

    qsa("#sidebar .section").forEach((section) => {
      const title = titleOf(section);
      section.classList.toggle("final-hidden-section", hideFromCollector(title));
      section.classList.toggle("final-offline-map-section", isOfflineMapSection(title));
    });

    setTimeout(() => {
      try{
        if(window.map && window.map.invalidateSize) window.map.invalidateSize();
      }catch(error){}
    }, 200);
  }

  function boot(){
    applyFinalLayout();

    const sidebar = document.getElementById("sidebar");
    if(sidebar){
      const observer = new MutationObserver(applyFinalLayout);
      observer.observe(sidebar, {childList:true, subtree:true});
    }

    window.addEventListener("resize", () => {
      setTimeout(() => {
        try{
          if(window.map && window.map.invalidateSize) window.map.invalidateSize();
        }catch(error){}
      }, 150);
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();



/* FINAL POLISH PATCH v210 */
(function(){
  function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }
  function titleOf(section){
    const h2 = section ? section.querySelector("h2") : null;
    return h2 ? h2.textContent.trim().toLowerCase() : "";
  }
  function classifyFinalSections(){
    qsa("#sidebar .section").forEach((section) => {
      const title = titleOf(section);
      const hide = title.includes("quick menu") || title.includes("settings") || title.includes("entries") || title.includes("operations") || title.includes("field readiness");
      const offline = title.includes("offline") || title.includes("basemap") || title.includes("mbtiles");
      section.classList.toggle("final-hidden-section", hide && !offline);
      section.classList.toggle("final-offline-map-section", offline);
    });
    setTimeout(() => {
      try{ if(window.map && window.map.invalidateSize) window.map.invalidateSize(); }catch(e){}
    }, 100);
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", classifyFinalSections, {once:true});
  }else{
    classifyFinalSections();
  }
  setTimeout(classifyFinalSections, 800);
  setTimeout(classifyFinalSections, 1800);
})();



/* FINAL MOBILE CLEANUP PATCH v220 */
(function(){
  function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }
  function qs(selector, root=document){ return root.querySelector(selector); }
  function titleOf(section){
    const h2 = section ? section.querySelector("h2") : null;
    return h2 ? h2.textContent.trim().toLowerCase() : "";
  }

  function isHiddenCollectorSection(title){
    return (
      title.includes("quick menu") ||
      title.includes("settings") ||
      title.includes("entries") ||
      title.includes("operations") ||
      title.includes("field readiness")
    );
  }

  function isOfflineMapSection(title){
    return title.includes("offline") || title.includes("basemap") || title.includes("mbtiles");
  }

  function removeOldUiOverlays(){
    qsa("#phase6-bottom-nav,.phase6-bottom-nav,#phase6-map-actions,.phase6-map-actions,#phase6-mobile-status,.phase6-mobile-status,[data-phase6-view],[class*='bottom-nav'],[id*='bottom-nav']").forEach((el)=>el.remove());
  }

  function classifySections(){
    qsa("#sidebar .section").forEach((section)=>{
      const title = titleOf(section);
      const offline = isOfflineMapSection(title);
      section.classList.toggle("final-offline-map-section", offline);
      section.classList.toggle("final-hidden-section", isHiddenCollectorSection(title) && !offline);
    });
  }

  function shortenStartButtons(){
    const cropButton = qs("#start-crop-survey") || qs("[data-action='start-crop-survey']");
    const livestockButton = qs("#start-livestock-survey") || qs("[data-action='start-livestock-survey']");
    if(cropButton && cropButton.dataset.finalShortened !== "true"){
      cropButton.dataset.finalShortened = "true";
      cropButton.innerHTML = cropButton.innerHTML.replace(/Start\s*Crop\s*Survey/ig, "Start Crop");
    }
    if(livestockButton && livestockButton.dataset.finalShortened !== "true"){
      livestockButton.dataset.finalShortened = "true";
      livestockButton.innerHTML = livestockButton.innerHTML.replace(/Start\s*Livestock\s*Survey/ig, "Start Livestock");
    }
  }

  function refreshFinalLayout(){
    document.body.classList.add("collector-final-layout");
    removeOldUiOverlays();
    classifySections();
    shortenStartButtons();
    setTimeout(()=>{
      try{ if(window.map && window.map.invalidateSize) window.map.invalidateSize(); }catch(e){}
    },120);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", refreshFinalLayout, {once:true});
  }else{
    refreshFinalLayout();
  }

  setTimeout(refreshFinalLayout, 600);
  setTimeout(refreshFinalLayout, 1600);

  const sidebar = document.getElementById("sidebar");
  if(sidebar){
    const observer = new MutationObserver(refreshFinalLayout);
    observer.observe(sidebar, {childList:true, subtree:true});
  }

  window.addEventListener("resize", ()=>setTimeout(refreshFinalLayout, 150));
})();



/* FINAL RUNTIME COMPATIBILITY PATCH v230 */
(function(){
  function cleanupFinalOverlays(){
    document.querySelectorAll("#phase6-bottom-nav,.phase6-bottom-nav,#phase6-map-actions,.phase6-map-actions,#phase6-mobile-status,.phase6-mobile-status,[data-phase6-view],[class*='bottom-nav'],[id*='bottom-nav']").forEach(function(el){
      el.remove();
    });
    try{
      if(window.map && window.map.invalidateSize) window.map.invalidateSize();
    }catch(error){}
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", cleanupFinalOverlays, {once:true});
  }else{
    cleanupFinalOverlays();
  }
  setTimeout(cleanupFinalOverlays, 1000);
  setTimeout(cleanupFinalOverlays, 2500);
})();


/* ============================================================
   CLEAN COLLECTOR DISPLAY PATCH v670 JS
   Restores start buttons and collapses Offline & Basemaps section.
   ============================================================ */
(function(){
  "use strict";

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }

  function sectionTitle(section){
    const h = section ? section.querySelector("h2") : null;
    return h ? (h.textContent || "").replace(/\s+/g, " ").trim().toLowerCase() : "";
  }

  function isAdvancedSection(title){
    return title.includes("settings") ||
           title.includes("entries") ||
           title.includes("operations") ||
           title.includes("field readiness");
  }

  function isOfflineSection(title){
    return title.includes("offline") ||
           title.includes("basemap") ||
           title.includes("mbtiles");
  }

  function fixSections(){
    qsa("#sidebar .section").forEach(function(section){
      const title = sectionTitle(section);
      const offline = isOfflineSection(title);

      section.classList.toggle("final-offline-map-section", offline);
      section.classList.toggle("final-hide-in-collector", isAdvancedSection(title) && !offline);
      section.classList.remove("final-hidden-section");

      if(offline){
        const h2 = section.querySelector("h2");
        if(h2 && h2.dataset.offlineToggleBound !== "true"){
          h2.dataset.offlineToggleBound = "true";
          h2.setAttribute("role", "button");
          h2.setAttribute("tabindex", "0");
          h2.addEventListener("click", function(){
            section.classList.toggle("offline-open");
          });
          h2.addEventListener("keydown", function(event){
            if(event.key === "Enter" || event.key === " "){
              event.preventDefault();
              section.classList.toggle("offline-open");
            }
          });
        }
      }
    });
  }

  function buttonLooksLike(button, type){
    const text = (button.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const id = (button.id || "").toLowerCase();
    const action = (button.getAttribute("data-action") || "").toLowerCase();

    if(type === "crop"){
      return id.includes("start-crop") || action.includes("start-crop") || text.includes("crop survey") || text === "crop" || text.includes("start crop");
    }
    return id.includes("start-livestock") || action.includes("start-livestock") || text.includes("livestock survey") || text === "livestock" || text.includes("start livestock");
  }

  function restoreSurveyButtons(){
    const form = document.getElementById("collect-form") || document.getElementById("crop-form") || document.getElementById("sidebar");
    if(!form) return;

    let crop = document.getElementById("start-crop-survey") || qsa("button", form).find(function(b){ return buttonLooksLike(b, "crop"); });
    let livestock = document.getElementById("start-livestock-survey") || qsa("button", form).find(function(b){ return buttonLooksLike(b, "livestock"); });

    let holder = document.getElementById("collector-primary-modules");

    if(!holder){
      holder = document.createElement("div");
      holder.id = "collector-primary-modules";
      holder.className = "status";
      const startSurveyHeading = document.getElementById("collect-form-heading") || form.querySelector("h2,h3");
      if(startSurveyHeading && startSurveyHeading.parentElement){
        startSurveyHeading.insertAdjacentElement("afterend", holder);
      }else{
        form.prepend(holder);
      }
    }

    if(crop && crop.parentElement !== holder) holder.appendChild(crop);
    if(livestock && livestock.parentElement !== holder) holder.appendChild(livestock);

    if(crop){
      crop.id = crop.id || "start-crop-survey";
      crop.style.display = "";
      crop.hidden = false;
      crop.removeAttribute("hidden");
      crop.disabled = false;
      crop.innerHTML = "<strong>Crop Survey</strong>";
      crop.dataset.finalBlockSurveyButton = "true";
    }

    if(livestock){
      livestock.id = livestock.id || "start-livestock-survey";
      livestock.style.display = "";
      livestock.hidden = false;
      livestock.removeAttribute("hidden");
      livestock.disabled = false;
      livestock.innerHTML = "<strong>Livestock Survey</strong>";
      livestock.dataset.finalBlockSurveyButton = "true";
    }
  }

  function removeClutterText(){
    qsa(".quick-menu-note,#collector-quick-menu p,#collector-quick-menu .status,#required-progress,#completion-status,#next-questions,#quality-score").forEach(function(el){
      el.style.display = "none";
    });

    qsa("#crop-form .status").forEach(function(el){
      const text = (el.textContent || "").toLowerCase();
      if(text.includes("setup step") || text.includes("required answers") || text.includes("up next") || text.includes("needs work")){
        el.style.display = "none";
      }
    });
  }

  function refresh(){
    document.body.classList.add("collector-final-layout");
    fixSections();
    restoreSurveyButtons();
    removeClutterText();
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

  setTimeout(refresh, 500);
  setTimeout(refresh, 1500);
  setTimeout(refresh, 3000);

  const sidebar = document.getElementById("sidebar");
  if(sidebar){
    new MutationObserver(function(){ setTimeout(refresh, 50); }).observe(sidebar, {childList:true, subtree:true});
  }
})();


/* ============================================================
   REMOVE COLLECTOR STATUS/HELPER TEXT v680 JS
   Removes exact unwanted text nodes/cards after the app renders.
   ============================================================ */
(function(){
  "use strict";

  const bannedPhrases = [
    "main collection tools stay up front",
    "required answers complete",
    "needs work",
    "up next:",
    "setup step"
  ];

  function textOf(el){
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function shouldRemove(el){
    const text = textOf(el);
    if(!text) return false;
    return bannedPhrases.some(function(phrase){ return text.includes(phrase); });
  }

  function protectImportant(el){
    if(!el) return true;
    if(el.matches && el.matches("input,select,textarea,button,option,label")) return true;
    if(el.querySelector && el.querySelector("input,select,textarea")) return true;
    if(el.id === "collector-primary-modules") return true;
    if(el.id === "start-crop-survey" || el.id === "start-livestock-survey") return true;
    return false;
  }

  function removeStatusText(){
    const selectors = [
      ".quick-menu-note",
      ".quick-menu-description",
      ".quick-menu-helper",
      "#collector-quick-menu p",
      "#collector-quick-menu .status",
      "#required-progress",
      "#completion-status",
      "#next-questions",
      "#quality-score",
      ".progress-card",
      ".form-progress",
      ".setup-progress",
      ".question-progress",
      ".step-progress",
      ".quality-card",
      ".quality-score-card",
      "#crop-form .status",
      "#crop-form .step-label",
      "#crop-form .step-summary",
      "#crop-form .setup-step",
      "#crop-form .question-step"
    ];

    selectors.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(el){
        if(!protectImportant(el)) el.remove();
      });
    });

    document.querySelectorAll("#sidebar div,#sidebar p,#sidebar small,#sidebar span,#sidebar section,#crop-form div").forEach(function(el){
      if(shouldRemove(el) && !protectImportant(el)){
        el.remove();
      }
    });
  }

  function ensureSurveyButtonsVisible(){
    const crop = document.getElementById("start-crop-survey") || document.querySelector("[data-action='start-crop-survey']");
    const livestock = document.getElementById("start-livestock-survey") || document.querySelector("[data-action='start-livestock-survey']");
    [crop, livestock].forEach(function(btn){
      if(!btn) return;
      btn.hidden = false;
      btn.removeAttribute("hidden");
      btn.style.display = "";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      btn.disabled = false;
    });
  }

  function refresh(){
    removeStatusText();
    ensureSurveyButtonsVisible();
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
    new MutationObserver(function(){ setTimeout(refresh, 50); }).observe(sidebar, {childList:true, subtree:true});
  }
})();
