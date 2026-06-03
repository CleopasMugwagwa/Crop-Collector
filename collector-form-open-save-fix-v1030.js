(function(){
  "use strict";

  const LOCAL_QUEUE_KEY = "local_field_entries_queue";
  const DEFAULT_SURVEYS = [
    { value: "2026 Crop Field Survey", label: "2026 Crop Field Survey" },
    { value: "2026 Livestock Field Survey", label: "2026 Livestock Field Survey" }
  ];

  const COMMON_IDS = [
    "survey-name", "questionnaire-id", "aeo-name", "aeo-contact-number",
    "owner-name", "farm-name", "farmer-contact", "province", "district",
    "ward", "aez", "sector", "observation-notes", "notes", "photo-data", "photo-name"
  ];

  const CROP_IDS = [
    "crop-type", "crop-variety", "planted-area-ha", "fertilizer-application",
    "pest-disease-status", "growth-stage", "crop-condition", "season",
    "irrigation-type", "planting-date", "harvest-date", "yield-expected",
    "yield-tonnes", "post-harvest-assessment"
  ];

  const LIVESTOCK_IDS = [
    "livestock-farm-type", "livestock-main-enterprise", "livestock-total-animals",
    "livestock-production-purpose", "livestock-management-system", "livestock-grazing-system",
    "livestock-feed-availability", "livestock-water-source", "livestock-health-status",
    "livestock-disease-observed", "livestock-vet-access", "livestock-vaccination-status",
    "livestock-mortality-reported", "livestock-market-access", "livestock-housing-condition",
    "livestock-manure-management"
  ];

  function $(id){ return document.getElementById(id); }
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
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("display", "none", "important");
  }

  function showAncestors(el){
    let node = el;
    while(node && node !== document.body){
      if(node.hidden) node.hidden = false;
      node.removeAttribute && node.removeAttribute("hidden");
      node.removeAttribute && node.removeAttribute("aria-hidden");
      if(node.style && node.style.display === "none") node.style.removeProperty("display");
      node = node.parentElement;
    }
  }

  function showField(id){
    const input = $(id);
    if(!input) return;
    const group = input.closest(".input-group") || input.parentElement;
    showAncestors(group || input);
    show(group || input, group && group.classList.contains("input-group") ? "block" : "");
    input.disabled = false;
    if(input.type !== "hidden") show(input, "");
  }

  function hideField(id){
    const input = $(id);
    if(!input) return;
    const group = input.closest(".input-group") || input.parentElement;
    hide(group || input);
    input.disabled = true;
  }

  function ensureSurveyOptions(){
    const menu = $("collector-survey-name");
    const field = $("survey-name");
    [menu, field].forEach(select => {
      if(!select) return;
      const realOptions = Array.from(select.options || []).filter(opt => String(opt.value || "").trim());
      if(realOptions.length === 0){
        DEFAULT_SURVEYS.forEach(item => {
          const opt = document.createElement("option");
          opt.value = item.value;
          opt.textContent = item.label;
          select.appendChild(opt);
        });
      }
    });
  }


  function inferSelectedSurveyType(){
    try{
      const configured = window.CropCollectorApp?.services?.getSelectedSurveyConfig?.()?.survey_type;
      if(configured === "crop" || configured === "livestock") return configured;
    }catch(e){}
    const menu = $("collector-survey-name");
    const field = $("survey-name");
    const option = menu?.selectedOptions?.[0] || field?.selectedOptions?.[0];
    const datasetType = option?.dataset?.surveyType;
    if(datasetType === "crop" || datasetType === "livestock") return datasetType;
    const text = `${menu?.value || ""} ${field?.value || ""} ${option?.textContent || ""}`.toLowerCase();
    if(/livestock|cattle|goat|sheep|poultry|meat|dairy/.test(text)) return "livestock";
    if(/crop|agric|agriculture|field|winter|maize|tobacco|sunflower|grain|plot/.test(text)) return "crop";
    return null;
  }

  function openSelectedSurveyForm(){
    const type = inferSelectedSurveyType();
    const selected = String($("collector-survey-name")?.value || $("survey-name")?.value || "").trim();
    if(!selected || (type !== "crop" && type !== "livestock")) return false;
    openFullForm(type);
    return true;
  }
  function optionModule(option){
    const datasetType = option?.dataset?.surveyType;
    if(datasetType === "crop" || datasetType === "livestock") return datasetType;
    const text = `${option?.value || ""} ${option?.textContent || ""}`.toLowerCase();
    if(/livestock|cattle|goat|sheep|poultry|meat|dairy/.test(text)) return "livestock";
    return "crop";
  }

  function ensureOption(select, value, module){
    if(!select || !value) return null;
    let option = Array.from(select.options || []).find(item => item.value === value);
    if(!option){
      option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
    option.dataset.surveyType = module;
    return option;
  }

  function preferredSurveyForModule(module){
    const menu = $("collector-survey-name");
    const field = $("survey-name");
    const options = Array.from((menu?.options?.length ? menu : field)?.options || []);
    const current = Array.from(options).find(option => option.value && option.value === (menu?.value || field?.value || ""));
    if(current && optionModule(current) === module) return current.value;
    const matching = options.find(option => option.value && optionModule(option) === module);
    if(matching) return matching.value;
    return module === "livestock" ? "00 Demo Livestock Survey" : "00 Demo Crop Survey";
  }

  function selectedSurveyValue(module){
    ensureSurveyOptions();
    const menu = $("collector-survey-name");
    const field = $("survey-name");
    const value = preferredSurveyForModule(module);
    [menu, field].forEach(select => {
      ensureOption(select, value, module);
      if(select) select.value = value;
    });
    try{ localStorage.setItem("last_survey_name", value); }catch(e){}
    return value;
  }


  function moduleQuestionnaireId(module){
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}${String(now.getSeconds()).padStart(2,"0")}`;
    return `${module === "livestock" ? "LVS" : "CRP"}-${stamp}`;
  }

  function ensureModuleQuestionnaireId(module, force=false){
    const field = $("questionnaire-id");
    if(!field) return "";
    const value = String(field.value || "").trim();
    const expectedPrefix = module === "livestock" ? "LVS-" : "CRP-";
    if(force || !value || !value.startsWith(expectedPrefix)){
      field.value = moduleQuestionnaireId(module);
      field.dispatchEvent(new Event("input", {bubbles:true}));
      field.dispatchEvent(new Event("change", {bubbles:true}));
    }
    return field.value;
  }
  function setActiveModule(module){
    document.body.dataset.collectorPrimaryModule = module;
    document.body.classList.add("collector-clean-question-mode");
    document.body.classList.toggle("collector-module-livestock", module === "livestock");
    window.activeCollectorPrimaryModule = module;
    window.selectedSurveyType = module;
    window.effectiveModule = module;
    window.currentSurveyModule = module;
    try{ window.CropCollectorApp?.state?.set?.("activeCollectorPrimaryModule", module); }catch(e){}
    ensureModuleQuestionnaireId(module);

    const cropBtn = $("collector-open-crop");
    const livestockBtn = $("collector-open-livestock");
    [cropBtn, livestockBtn].forEach(button => { if(button){ button.disabled = false; button.removeAttribute("disabled"); button.title = ""; }});
    cropBtn?.classList.toggle("active", module === "crop");
    cropBtn?.classList.toggle("secondary", module !== "crop");
    cropBtn?.setAttribute("aria-pressed", module === "crop" ? "true" : "false");
    livestockBtn?.classList.toggle("active", module === "livestock");
    livestockBtn?.classList.toggle("secondary", module !== "livestock");
    livestockBtn?.setAttribute("aria-pressed", module === "livestock" ? "true" : "false");

    const label = $("collector-module-active-label");
    if(label){
      label.textContent = module === "crop" ? "Crop survey selected." : "Livestock survey selected.";
      label.hidden = true;
      label.style.setProperty("display", "none", "important");
    }

    const heading = $("collect-form-heading");
    if(heading){
      heading.innerHTML = module === "crop" ? '<i data-feather="clipboard"></i> Crop Survey' : '<i data-feather="clipboard"></i> Livestock Survey';
    }
  }


  let lastForcedNavAt = 0;

  function revealCurrentWizardQuestion(){
    enforceCleanCollectorChrome();
    const activeLabel = $("collector-module-active-label");
    if(activeLabel){ activeLabel.hidden = true; activeLabel.style.setProperty("display", "none", "important"); }
    const module = currentWizardModule();
    const flow = window.getCollectorQuestionFlow?.(module) || [];
    const currentKey = flow[currentWizardIndex()] || "";
    const active = window.getCollectorQuestionNode?.(currentKey) || document.querySelector("#crop-form .odk-question-active");
    qsa("#crop-form .odk-question-active").forEach(node => {
      if(node !== active) node.classList.remove("odk-question-active");
    });
    qsa("#crop-form .input-group").forEach(group => {
      if(group !== active){
        group.hidden = true;
        group.style.setProperty("display", "none", "important");
      }
    });
    if(active){
      active.classList.add("odk-question-active");
      active.hidden = false;
      active.style.setProperty("display", "block", "important");
      active.querySelectorAll("input,select,textarea").forEach(control => {
        if(control.type !== "hidden") control.disabled = false;
      });
    }
    const nav = $("collector-odk-nav");
    const step = $("collector-odk-step-label");
    const activePanel = active?.closest(".collect-step-panel");
    qsa("#crop-form .collect-step-panel").forEach(panel => {
      const isActive = panel === activePanel || panel.contains(nav) || panel.contains(step);
      if(isActive){
        panel.hidden = false;
        panel.removeAttribute("hidden");
        panel.style.setProperty("display", "block", "important");
      }else{
        panel.hidden = true;
        panel.style.setProperty("display", "none", "important");
      }
    });
    if(active){
      showAncestors(active);
      const section = active.closest(".questionnaire-group");
      if(section){
        section.hidden = false;
        section.classList.add("odk-section-active");
        section.style.setProperty("display", "block", "important");
      }
      const details = active.closest("details");
      if(details){
        details.open = true;
        details.hidden = false;
        details.style.setProperty("display", "block", "important");
      }
      active.hidden = false;
      active.style.setProperty("display", "block", "important");
    }
    if(nav){
      nav.hidden = false;
      nav.removeAttribute("hidden");
      nav.style.setProperty("display", "flex", "important");
    }
    if(step){
      step.hidden = false;
      step.removeAttribute("hidden");
      step.style.setProperty("display", "block", "important");
    }
    const next = $("collector-odk-next");
    const save = $("save-entry-btn");
    const nextPlot = $("save-next-plot-btn");
    const flowForSave = window.getCollectorQuestionFlow?.(module) || [];
    const finalStep = flowForSave.length > 0 && currentWizardIndex() >= flowForSave.length - 1;
    const saveStack = $("save-action-stack");
    const saveFlowCard = $("save-flow-card");
    document.body.classList.toggle("collector-final-step", finalStep);
    if(saveStack){
      saveStack.hidden = !finalStep;
      saveStack.style.setProperty("display", finalStep ? "block" : "none", "important");
    }
    if(saveFlowCard){
      saveFlowCard.hidden = !finalStep;
      saveFlowCard.style.setProperty("display", finalStep ? "block" : "none", "important");
    }
    if(save){
      if(finalStep){
        save.hidden = false;
        save.style.setProperty("display", "flex", "important");
      }else{
        save.hidden = true;
        save.style.setProperty("display", "none", "important");
      }
    }
    if(nextPlot && !finalStep){
      nextPlot.hidden = true;
      nextPlot.style.setProperty("display", "none", "important");
    }
  }


  function currentWizardIndex(){
    const stateValue = window.CropCollectorApp?.state?.get?.("currentCollectorWizardStep");
    return Number(stateValue ?? window.currentCollectorWizardStep ?? 0) || 0;
  }

  function currentWizardModule(){
    const stateValue = window.CropCollectorApp?.state?.get?.("activeCollectorPrimaryModule");
    return stateValue === "livestock" ? "livestock" : document.body.dataset.collectorPrimaryModule === "livestock" ? "livestock" : "crop";
  }

  function forceWizardMove(delta){
    const module = currentWizardModule();
    const flow = window.getCollectorQuestionFlow?.(module) || [];
    if(!flow.length || typeof window.setCollectorWizardStep !== "function") return false;
    const nextIndex = Math.max(0, Math.min(currentWizardIndex() + delta, flow.length - 1));
    window.setCollectorWizardStep(nextIndex);
    setTimeout(revealCurrentWizardQuestion, 0);
    return true;
  }
  function installWizardRevealGuard(){
    if(window.__collectorWizardRevealGuardInstalled) return;
    window.__collectorWizardRevealGuardInstalled = true;
    const original = window.setCollectorWizardStep;
    if(typeof original === "function"){
      window.setCollectorWizardStep = function(...args){
        const result = original.apply(this, args);
        setTimeout(revealCurrentWizardQuestion, 0);
        return result;
      };
    }
    ["pointerup", "click"].forEach(type => {
      document.addEventListener(type, event => {
        if(event.target.closest("#collector-odk-next")){
          event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
          const now = Date.now();
          if(now - lastForcedNavAt > 250){ lastForcedNavAt = now; forceWizardMove(1); }
          return;
        }
        if(event.target.closest("#collector-odk-back")){
          event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
          const now = Date.now();
          if(now - lastForcedNavAt > 250){ lastForcedNavAt = now; forceWizardMove(-1); }
          return;
        }
        if(event.target.closest("#collector-odk-next,#collector-odk-back")) setTimeout(revealCurrentWizardQuestion, 0);
      }, true);
    });
  }
  function openFullForm(module){
    if(module !== "crop" && module !== "livestock") return;
    selectedSurveyValue(module);
    setActiveModule(module);

    const form = $("crop-form");
    const collectForm = $("collect-form");
    const modulesCard = $("collector-primary-modules");
    show(collectForm, "block");
    show(form, "block");
    show(modulesCard, "block");
    show($("collector-odk-nav"), "flex");
    show($("collector-odk-step-label"), "block");
    hide($("collect-step-toggle"));
    hide($("collect-basic-guidance"));
    hide($("collect-more-guidance"));

    if(module === "crop"){
      LIVESTOCK_IDS.forEach(id => { const input = $(id); if(input) input.disabled = true; });
      CROP_IDS.concat(COMMON_IDS).forEach(id => { const input = $(id); if(input) input.disabled = false; });
      const capture = $("capture-type");
      if(capture) capture.value = "polygon";
    }else{
      CROP_IDS.forEach(id => { const input = $(id); if(input) input.disabled = true; });
      LIVESTOCK_IDS.concat(COMMON_IDS).forEach(id => { const input = $(id); if(input) input.disabled = false; });
      const capture = $("capture-type");
      if(capture) capture.value = "point";
    }

    try{
      if(typeof window.setCollectorPrimaryModule === "function"){
        window.setCollectorPrimaryModule(module);
      }
      if(typeof window.setCollectorWizardStep === "function"){
        const flow = window.getCollectorQuestionFlow?.(module) || [];
        const preferred = module === "crop" ? "collector-draw-section" : "aeo-name";
        window.setCollectorWizardStep(Math.max(0, flow.indexOf(preferred)));
      }
    }catch(e){
      console.warn("Crop Collector wizard open failed", e);
    }

    const save = $("save-entry-btn");
    if(save){
      save.type = "submit";
      save.disabled = false;
      save.innerHTML = '<i data-feather="save"></i> Save Entry';
      save.hidden = true;
      save.style.setProperty("display", "none", "important");
    }

    hide($("select-polygon-btn"));
    hide($("save-next-plot-btn"));

    const active = document.querySelector(".odk-question-active") || $("collector-odk-step-label") || form;
    setTimeout(() => active?.scrollIntoView?.({behavior:"smooth", block:"center"}), 50);
    revealCurrentWizardQuestion();
    setTimeout(revealCurrentWizardQuestion, 0);
    setTimeout(revealCurrentWizardQuestion, 120);
    setTimeout(revealCurrentWizardQuestion, 500);
    try{ feather.replace(); }catch(e){}
  }

  function notify(message, type){
    const feedback = $("collector-feedback");
    const text = $("collector-feedback-message");
    if(feedback && text){
      text.textContent = message;
      feedback.className = `status collector-feedback ${type || "info"}`;
      feedback.hidden = false;
      show(feedback, "block");
    }
    const activeLabel = $("collector-module-active-label");
    if(activeLabel && type === "error"){
      activeLabel.textContent = message;
      activeLabel.className = "status error";
      show(activeLabel, "block");
    }
    if(typeof window.showCollectorFeedback === "function"){
      window.showCollectorFeedback(message, type || "info", {sticky:type === "error"});
    }
  }

  function value(id){ return String($(id)?.value || "").trim(); }

  function enforceCropGeofenceBeforeSave(module, geometry){
    if(module !== "crop") return {ok:true};
    if(!geometry || geometry.type !== "Polygon"){
      return {ok:false, message:"Crop records require a field polygon. Draw the field boundary before saving."};
    }
    const result = window.validateCollectorGeofence?.(geometry, 20, {strict:true, maxGpsAccuracyMeters:50});
    if(!result) return {ok:true};
    if(result.state === "gps-skipped"){
      return {...result, ok:true, requiresReview:true, geofenceStatus:"gps_skipped", geofenceMessage:result.message};
    }
    if(result.ok === false){
      return {...result, ok:false, geofenceStatus:(result.state||"geofence_blocked").replace(/-/g,"_"), geofenceMessage:result.message};
    }
    return {...result, ok:true, geofenceStatus:(result.state||"checked").replace(/-/g,"_"), geofenceMessage:result.message};
  }
  function getGeometry(module){
    try{
      const selected = window.CropCollectorApp?.state?.get?.("selectedPolygon") || window.selectedPolygon;
      if(selected && typeof selected.toGeoJSON === "function") return selected.toGeoJSON().geometry;
    }catch(e){}
    try{
      const map = window.CropCollectorApp?.state?.get?.("map") || window.map || window.collectorMap;
      if(module === "livestock" && map && typeof map.getCenter === "function"){
        const c = map.getCenter();
        return {type:"Point", coordinates:[Number(c.lng), Number(c.lat)]};
      }
    }catch(e){}
    // Last-resort fallback so the form still saves and can sync later after geometry is corrected.
    return module === "livestock" ? {type:"Point", coordinates:[0,0]} : null;
  }

  function buildFallbackRecord(){
    const module = document.body.dataset.collectorPrimaryModule === "livestock" ? "livestock" : "crop";
    const now = new Date().toISOString();
    const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const geometry = getGeometry(module);
    const livestockExtras = {};
    LIVESTOCK_IDS.forEach(id => { livestockExtras[id.replace(/-([a-z])/g, (_,c)=>c.toUpperCase())] = value(id); });
    return {
      localId,
      id:null,
      serverId:null,
      surveyName: selectedSurveyValue(module),
      primaryModule: module,
      ownerName: value("owner-name") || "Unknown farmer",
      farmName: value("farm-name"),
      questionnaireId: ensureModuleQuestionnaireId(module) || `Q-${Date.now()}`,
      aeoName: value("aeo-name") || "Collector",
      aeoContactNumber: value("aeo-contact-number"),
      farmerContact: value("farmer-contact"),
      province: value("province"),
      district: value("district"),
      ward: value("ward"),
      aez: value("aez"),
      sector: value("sector"),
      captureType: module === "livestock" ? "point" : (geometry?.type === "Point" ? "point" : "polygon"),
      cropType: module === "crop" ? value("crop-type") : "",
      cropName: module === "crop" ? (($("crop-type")?.selectedOptions?.[0]?.textContent || value("crop-type"))) : "Livestock Record",
      growthStage: value("growth-stage"),
      cropCondition: value("crop-condition"),
      season: value("season"),
      irrigationType: value("irrigation-type"),
      plantingDate: value("planting-date"),
      harvestDate: value("harvest-date"),
      yieldExpected: value("yield-expected"),
      yieldTonnes: value("yield-tonnes"),
      observationNotes: value("observation-notes"),
      postHarvestAssessment: value("post-harvest-assessment"),
      notes: value("notes"),
      photoName: value("photo-name"),
      photoData: value("photo-data"),
      workflowExtras: livestockExtras,
      livestockModules: module === "livestock" ? [{module_code:"livestock_overview", module_label:"Livestock Overview", answers:Object.entries(livestockExtras).filter(([,v])=>v).map(([key,v])=>({key,label:key,value:v,kind:"text"}))}] : [],
      geometry,
      area:"0.00",
      collectedAsGuest:true,
      source:"local",
      createdOffline:true,
      createdAtLocal:now,
      updatedAtLocal:now,
      syncStatus:"pending",
      validationStatus:"uncertain",
      reviewStatus:"pending_review"
    };
  }

  function getQueue(){
    try{
      const stateQueue = window.CropCollectorApp?.state?.get?.("localQueueInMemory");
      if(Array.isArray(stateQueue) && stateQueue.length) return stateQueue.slice();
    }catch(e){}
    try{ return JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || "[]"); }catch(e){ return []; }
  }

  function setQueue(queue){
    try{ window.CropCollectorApp?.state?.set?.("localQueueInMemory", queue); }catch(e){}
    try{ localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(queue)); }catch(e){}
  }

  async function saveFallbackRecord(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    const form = $("crop-form");
    const module = document.body.dataset.collectorPrimaryModule === "livestock" ? "livestock" : "crop";
    if(!form || (module !== "crop" && module !== "livestock")){
      notify("Open Crop Survey or Livestock Survey first.", "warning");
      return false;
    }

    const geometry = getGeometry(module);
    const geofence = enforceCropGeofenceBeforeSave(module, geometry);
    if(geofence && geofence.ok === false){
      notify(geofence.message || "Geofence check failed. Move closer to the field and try again.", "error");
      try{ window.showCollectorFeedback?.(geofence.message || "Geofence check failed.", "error", {sticky:true}); }catch(e){}
      return false;
    }

    const record = buildFallbackRecord();
    const queue = getQueue().filter(item => String(item.localId) !== String(record.localId));
    queue.unshift(record);
    setQueue(queue);

    notify("Entry saved locally. It will appear under Entries and can sync when online.", "success");
    try{ await window.CropCollectorApp?.getModule?.("sync")?.loadEntries?.(); }catch(e){}
    try{ window.CropCollectorApp?.getModule?.("sync")?.refreshCollectorData?.(); }catch(e){}
    try{ await window.CropCollectorOfflineSync?.updateSyncPanel?.(); }catch(e){}
    setTimeout(() => { try{ window.CropCollectorOfflineSync?.updateSyncPanel?.(); }catch(e){} }, 350);
    [150, 800, 1800].forEach(delay => setTimeout(() => {
      if(window.CropCollectorApp?.state?.get?.("saveNextPlotForFarmer")) return;
      if(typeof window.resetCollectorForNewRecord === "function"){
        window.resetCollectorForNewRecord();
      }else{
        setActiveModule(null);
        window.setCollectorPrimaryModule?.(null);
      }
      document.body.dataset.collectorPrimaryModule = "choose";
      window.activeCollectorPrimaryModule = null;
      window.effectiveModule = null;
      window.selectedSurveyType = null;
      window.currentSurveyModule = null;
      $("collector-open-crop")?.classList.remove("active");
      $("collector-open-livestock")?.classList.remove("active");
      $("collector-open-crop")?.classList.add("secondary");
      $("collector-open-livestock")?.classList.add("secondary");
    }, delay));
    return false;
  }


  function enforceCleanCollectorChrome(){
    document.body.classList.add("collector-clean-question-mode");
    const module = currentWizardModule();
    document.body.dataset.collectorPrimaryModule = module;
    const label = $("collector-module-active-label");
    if(label){
      label.hidden = true;
      label.style.setProperty("display", "none", "important");
      label.style.setProperty("visibility", "hidden", "important");
    }
    const cropBtn = $("collector-open-crop");
    const livestockBtn = $("collector-open-livestock");
    [cropBtn, livestockBtn].forEach(button => {
      if(button){ button.disabled = false; button.removeAttribute("disabled"); button.title = ""; }
    });
    cropBtn?.classList.toggle("active", module === "crop");
    cropBtn?.classList.toggle("secondary", module !== "crop");
    livestockBtn?.classList.toggle("active", module === "livestock");
    livestockBtn?.classList.toggle("secondary", module !== "livestock");
  }

  function installCleanChromeGuard(){
    if(window.__collectorCleanChromeGuardInstalled) return;
    window.__collectorCleanChromeGuardInstalled = true;
    enforceCleanCollectorChrome();
    [250, 800, 1600].forEach(delay => setTimeout(enforceCleanCollectorChrome, delay));
  }
  function installEvents(){
    if(window.__collectorFormOpenSaveFixInstalled) return;
    window.__collectorFormOpenSaveFixInstalled = true;

    document.addEventListener("click", function(event){
      if(event.target.closest("#collector-open-crop")){
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        openFullForm("crop");
      }
      if(event.target.closest("#collector-open-livestock")){
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        openFullForm("livestock");
      }
    }, true);

    const form = $("crop-form");
    if(form){
      form.addEventListener("submit", saveFallbackRecord, true);
    }

    [$("collector-survey-name"), $("survey-name")].forEach(select => {
      select?.addEventListener("change", () => setTimeout(openSelectedSurveyForm, 0), true);
    });

    const save = $("save-entry-btn");
    if(save){
      save.addEventListener("click", function(){
        const module = document.body.dataset.collectorPrimaryModule;
        if(module === "crop" || module === "livestock") setTimeout(()=>show(save,"flex"), 0);
      }, true);
    }
  }

  function boot(){
    ensureSurveyOptions();
    installCleanChromeGuard();
    installWizardRevealGuard();
    installEvents();
    const module = document.body.dataset.collectorPrimaryModule;
    if(module === "crop" || module === "livestock") openFullForm(module);
    else {
      setTimeout(openSelectedSurveyForm, 500);
      setTimeout(openSelectedSurveyForm, 1500);
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  window.openCropCollectorForm = () => openFullForm("crop");
  window.openLivestockCollectorForm = () => openFullForm("livestock");
  window.openSelectedCropCollectorSurveyForm = openSelectedSurveyForm;
})();
