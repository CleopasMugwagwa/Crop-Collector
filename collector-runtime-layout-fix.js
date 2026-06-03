
/* ============================================================
   COLLECTOR RUNTIME + CLEAN LAYOUT FIX v690
   Fixes renderEntries null crash and keeps UI clean.
   ============================================================ */
(function(){
  "use strict";

  const advancedTitles = ["settings", "operations", "field readiness"];
  const offlineTitles = ["offline", "basemap", "mbtiles"];
  const badPhrases = [
    "main collection tools stay up front",
    "required answers complete",
    "needs work",
    "up next:",
    "setup step"
  ];

  function qsa(selector, root){ return Array.from((root || document).querySelectorAll(selector)); }
  function text(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim(); }
  function lower(el){ return text(el).toLowerCase(); }

  function ensureElement(id, tag, parentSelector, className){
    let el = document.getElementById(id);
    if(el) return el;

    const parent = document.querySelector(parentSelector) || document.getElementById("sidebar") || document.body;
    el = document.createElement(tag);
    el.id = id;
    if(className) el.className = className;
    el.hidden = true;
    el.style.display = "none";
    parent.appendChild(el);
    return el;
  }

  function ensureAppSyncTargets(){
    // app-sync.js renderEntries commonly writes to these. Keep them available even if entries UI is hidden.
    ensureElement("fields-list", "ul", "#sidebar", "entries");
    ensureElement("ops-history-list", "ul", "#sidebar", "ops-history-list");

    if(!document.getElementById("field-count")){
      const span = document.createElement("span");
      span.id = "field-count";
      span.textContent = "0 / 0";
      span.hidden = true;
      span.style.display = "none";
      (document.getElementById("sidebar") || document.body).appendChild(span);
    }

    ["pending-count","synced-count","failed-count"].forEach(function(id){
      if(!document.getElementById(id)){
        const strong = document.createElement("strong");
        strong.id = id;
        strong.textContent = "0";
        strong.hidden = true;
        strong.style.display = "none";
        (document.getElementById("sidebar") || document.body).appendChild(strong);
      }
    });
  }

  function classifySections(){
    qsa("#sidebar .section").forEach(function(section){
      const title = lower(section.querySelector("h2"));
      const isOffline = offlineTitles.some(function(t){ return title.includes(t); });
      const isAdvanced = advancedTitles.some(function(t){ return title.includes(t); });

      section.classList.toggle("final-offline-map-section", isOffline);
      section.classList.toggle("final-hide-in-collector", isAdvanced && !isOffline);

      if(isOffline){
        section.classList.remove("final-hidden-section");
        const h2 = section.querySelector("h2");
        if(h2 && h2.dataset.v690OfflineBound !== "true"){
          h2.dataset.v690OfflineBound = "true";
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

  function hideClutterText(){
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
      "#wizard-progress",
      "#collector-progress",
      "#form-progress",
      ".progress-card",
      ".form-progress",
      ".setup-progress",
      ".question-progress",
      ".step-progress",
      ".quality-card",
      ".quality-score-card",
      "#crop-form .step-label",
      "#crop-form .step-summary",
      "#crop-form .setup-step",
      "#crop-form .question-step"
    ];

    selectors.forEach(function(selector){
      qsa(selector).forEach(function(el){
        el.hidden = true;
        el.style.display = "none";
      });
    });

    qsa("#crop-form .status,#sidebar .status").forEach(function(el){
      const t = lower(el);
      if(badPhrases.some(function(p){ return t.includes(p); })){
        el.hidden = true;
        el.style.display = "none";
      }
    });
  }

  function restoreSurveyButtons(){
    const holder = document.getElementById("collector-primary-modules");
    const crop = document.getElementById("start-crop-survey") || document.querySelector("[data-action='start-crop-survey']");
    const livestock = document.getElementById("start-livestock-survey") || document.querySelector("[data-action='start-livestock-survey']");

    if(holder){
      holder.hidden = false;
      holder.removeAttribute("hidden");
      holder.style.display = "grid";
    }

    [
      [crop, "Crop Survey"],
      [livestock, "Livestock Survey"]
    ].forEach(function(pair){
      const btn = pair[0];
      if(!btn) return;
      btn.hidden = false;
      btn.removeAttribute("hidden");
      btn.disabled = false;
      btn.style.display = "flex";
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      if(!btn.dataset.v690Labelled){
        btn.innerHTML = "<strong>" + pair[1] + "</strong>";
        btn.dataset.v690Labelled = "true";
      }
    });
  }

  function makeCollectUsable(){
    const collectForm = document.getElementById("collect-form");
    const validateForm = document.getElementById("validate-form");
    const collectActive = qsa(".mode-toggle button").some(function(btn){
      return lower(btn).includes("collect") && btn.classList.contains("active");
    });

    if(collectForm && collectActive){
      collectForm.hidden = false;
      collectForm.removeAttribute("hidden");
      collectForm.setAttribute("aria-hidden", "false");
      collectForm.style.display = "";
    }

    if(validateForm && collectActive){
      validateForm.hidden = true;
      validateForm.setAttribute("aria-hidden", "true");
      validateForm.style.display = "none";
    }
  }

  function hideKnownRecoveredError(){
    const msg = document.getElementById("collector-feedback-message");
    const box = document.getElementById("collector-feedback");
    if(msg && box && msg.textContent.includes("Cannot set properties of null")){
      box.hidden = true;
      box.style.display = "none";
      msg.textContent = "";
    }
  }

  function refresh(){
    document.body.classList.add("collector-final-layout");
    ensureAppSyncTargets();
    classifySections();
    hideClutterText();
    restoreSurveyButtons();
    makeCollectUsable();
    hideKnownRecoveredError();
    setTimeout(function(){
      try{
        if(window.map && window.map.invalidateSize) window.map.invalidateSize();
        if(window.collectorMap && window.collectorMap.invalidateSize) window.collectorMap.invalidateSize();
      }catch(error){}
    }, 80);
  }

  window.addEventListener("error", function(event){
    if(event && event.message && event.message.includes("Cannot set properties of null")){
      ensureAppSyncTargets();
      setTimeout(refresh, 50);
    }
  }, true);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", refresh, {once:true});
  }else{
    refresh();
  }

  setTimeout(refresh, 300);
  setTimeout(refresh, 900);
  setTimeout(refresh, 1800);
  setTimeout(refresh, 3000);
  setInterval(refresh, 4000);

  const sidebar = document.getElementById("sidebar");
  if(sidebar){
    new MutationObserver(function(){ setTimeout(refresh, 40); }).observe(sidebar, {childList:true, subtree:true, attributes:true});
  }
})();
