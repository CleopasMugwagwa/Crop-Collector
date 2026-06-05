(function(){
  const SUPPORT_SECTION_NAMES = [
    "Operations",
    "Field Readiness",
    "Offline & Basemaps",
    "Settings"
  ];

  function sectionTitle(section){
    return String(section?.querySelector("h2")?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function setSectionCollapsed(section, collapsed){
    if(!section) return;
    const title = sectionTitle(section);
    if(typeof window.setSidebarSectionCollapsed === "function"){
      window.setSidebarSectionCollapsed(section, !!collapsed);
    }
    section.dataset.collapsed = collapsed ? "true" : "false";
    section.classList.toggle("collector-support-collapsed", !!collapsed);
    section.classList.toggle("collector-support-open", !collapsed);
    section.classList.toggle("offline-open", title.includes("Offline & Basemaps") && !collapsed);
    const heading = section.querySelector("h2");
    if(heading){
      heading.setAttribute("aria-expanded", String(!collapsed));
      heading.setAttribute("role", "button");
      heading.setAttribute("tabindex", "0");
    }
    if(typeof window.setSidebarSectionCollapsed !== "function"){
      Array.from(section.children).forEach(child => {
        if(child.tagName === "H2") return;
        child.hidden = !!collapsed;
        child.style.display = collapsed ? "none" : "";
      });
    }
  }
  function findSupportSection(name){
    return Array.from(document.querySelectorAll("#sidebar .section"))
      .find(section => sectionTitle(section).includes(name));
  }

  function collapseSupportSections(){
    window.initSidebarSections?.();
    document.querySelectorAll("#sidebar .section").forEach(section => {
      const title = sectionTitle(section);
      if(!SUPPORT_SECTION_NAMES.some(name => title.includes(name))) return;
      const heading = section.querySelector("h2");
      if(!heading?.dataset.menuReady && !section.dataset.cleanDisplayBound){
        section.dataset.cleanDisplayBound = "true";
        const toggle = event => {
          event.preventDefault();
          event.stopPropagation();
          const nextCollapsed = section.dataset.collapsed !== "true";
          section.dataset.userOpenedCleanDisplay = nextCollapsed ? "" : "true";
          setSectionCollapsed(section, nextCollapsed);
        };
        heading?.addEventListener("click", toggle);
        heading?.addEventListener("keydown", event => {
          if(event.key === "Enter" || event.key === " ") toggle(event);
        });
      }
      if(!section.dataset.cleanDisplayInitialized){
        section.dataset.cleanDisplayInitialized = "true";
        if(section.dataset.collapsed === undefined){
          setSectionCollapsed(section, true);
        }
      }
      const collapsed = section.dataset.collapsed === "true";
      section.classList.toggle("collector-support-collapsed", collapsed);
      section.classList.toggle("collector-support-open", !collapsed);
      section.classList.toggle("offline-open", title.includes("Offline & Basemaps") && !collapsed);
      if(heading) heading.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  function hideSecondPlotHelper(){
    const helper = document.getElementById("second-plot-helper");
    if(helper){
      helper.hidden = true;
      helper.style.display = "none";
    }
  }


  function ensureOfflineMapUpload(){
    const offlineSection = findSupportSection("Offline & Basemaps");
    if(!offlineSection) return;
    let upload = document.getElementById("offline-map-upload-panel");
    if(!upload){
      upload = document.createElement("div");
      upload.id = "offline-map-upload-panel";
      upload.className = "status offline-map-upload-panel";
      upload.innerHTML = '<strong>Offline Map Upload</strong><span>Choose the MBTiles file prepared in QGIS.</span><button type="button" id="offline-map-upload-btn" class="secondary"><i data-feather="upload"></i> Upload MBTiles</button><input type="file" id="offline-map-upload-file" accept=".mbtiles,.sqlite,.db,application/octet-stream">';
      const status = document.getElementById("offline-status");
      offlineSection.insertBefore(upload, status || offlineSection.children[1] || null);
    }
    const fileInput = upload.querySelector("#offline-map-upload-file");
    const button = upload.querySelector("#offline-map-upload-btn");
    if(fileInput && fileInput.dataset.bound !== "true"){
      fileInput.dataset.bound = "true";
      fileInput.addEventListener("change", event => {
        if(window.__collectorHandleMbtilesDirect) window.__collectorHandleMbtilesDirect(event.target);
      });
    }
    if(button && button.dataset.bound !== "true"){
      button.dataset.bound = "true";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if(window.__collectorOpenMbtilesPicker){
          window.__collectorOpenMbtilesPicker();
        }else{
          fileInput?.click();
        }
      });
    }
    const isOpen = offlineSection.dataset.collapsed !== "true" || offlineSection.classList.contains("offline-open") || offlineSection.classList.contains("collector-support-open");
    upload.hidden = !isOpen;
    upload.style.display = isOpen ? "grid" : "none";
  }
  function compactOfflineSync(){
    const panel = document.getElementById("offline-sync-panel");
    if(panel){
      const offlineSection = findSupportSection("Offline & Basemaps");
      if(offlineSection && !offlineSection.contains(panel)) offlineSection.appendChild(panel);
      if(!panel.dataset.cleanDisplayInitialized){
        panel.open = false;
        panel.dataset.cleanDisplayInitialized = "true";
      }
      panel.classList.add("collector-sync-compact");
      const summary = panel.querySelector("summary");
      if(summary) summary.textContent = "Sync & Backup";
    }
  }

  function hasCurrentCollectorGeometry(){
    const layer = window.selectedPolygon;
    if(!layer || typeof layer.toGeoJSON !== "function") return false;
    try{
      const geojson = layer.toGeoJSON();
      const geometry = geojson?.geometry || geojson;
      return !!(geometry && geometry.type && geometry.coordinates !== undefined);
    }catch{
      return false;
    }
  }

  function updateCropBoundaryGate(){
    const next = document.getElementById("collector-odk-next");
    const progress = document.getElementById("collector-odk-step-label");
    if(!next || !progress) return;

    const module = document.body.dataset.collectorPrimaryModule || window.activeCollectorPrimaryModule || "";
    const onCropBoundaryStep = module === "crop" && /Draw field boundary/i.test(progress.textContent || "");
    if(!onCropBoundaryStep){
      if(next.dataset.boundaryGate === "true"){
        next.disabled = false;
        next.removeAttribute("aria-disabled");
        next.removeAttribute("title");
        delete next.dataset.boundaryGate;
      }
      return;
    }

    const blocked = !hasCurrentCollectorGeometry();
    next.disabled = blocked;
    next.dataset.boundaryGate = "true";
    next.setAttribute("aria-disabled", String(blocked));
    next.title = blocked ? "Draw and select the crop field polygon before moving to the next question." : "";
  }

  function installBoundaryGateEvents(){
    if(window.__collectorBoundaryGateEvents) return;
    window.__collectorBoundaryGateEvents = true;
    const bindMap = () => {
      const map = window.collectorMap || window.map;
      if(!map || map.__collectorBoundaryGateBound) return;
      map.__collectorBoundaryGateBound = true;
      ["draw:created","draw:edited","draw:deleted","click"].forEach(eventName => {
        map.on?.(eventName, () => setTimeout(updateCropBoundaryGate, 80));
      });
    };
    [250, 900, 1800, 3500].forEach(delay => setTimeout(() => {
      bindMap();
      updateCropBoundaryGate();
    }, delay));
    document.addEventListener("click", event => {
      if(event.target?.closest?.("#collector-open-crop,#collector-open-livestock,#collector-odk-back,#collector-odk-next")){
        setTimeout(updateCropBoundaryGate, 120);
      }
    }, true);
  }

  function polishStartSurvey(){
    const heading = document.getElementById("collect-form-heading");
    if(heading && !/Start Field Record/i.test(heading.textContent || "")){
      const icon = heading.querySelector("svg,i");
      heading.textContent = "";
      if(icon) heading.appendChild(icon);
      heading.appendChild(document.createTextNode(" Start Field Record"));
      heading.dataset.cleanPolished = "true";
    }

    const title = document.querySelector("#collector-primary-modules .questionnaire-group-title");
    if(title) title.textContent = "Choose collection type";

    const help = document.querySelector("#collector-primary-modules .collector-start-help");
    if(help) help.remove();

    const crop = document.getElementById("collector-open-crop");
    if(crop && !crop.querySelector(".collector-module-copy")){
      crop.innerHTML = '<span class="collector-module-icon crop-icon" aria-hidden="true"></span><span class="collector-module-copy"><strong>Crop Field</strong><small>Draw boundary</small></span>';
      crop.dataset.cleanPolished = "true";
    }

    const livestock = document.getElementById("collector-open-livestock");
    if(livestock && !livestock.querySelector(".collector-module-copy")){
      livestock.innerHTML = '<span class="collector-module-icon livestock-icon" aria-hidden="true"></span><span class="collector-module-copy"><strong>Livestock Record</strong><small>Capture point</small></span>';
      livestock.dataset.cleanPolished = "true";
    }

    const label = document.getElementById("collector-module-active-label");
    if(label && /Choose a survey type/i.test(label.textContent || "")){
      label.textContent = "Choose Crop Field or Livestock Record to begin.";
    }
  }

  function applyCleanDisplay(){
    if(document.body.dataset.cleanDisplayApplying === "true") return;
    document.body.dataset.cleanDisplayApplying = "true";
    document.body.classList.add("collector-clean-display-v1050");
    polishStartSurvey();
    updateCropBoundaryGate();
    hideSecondPlotHelper();
    compactOfflineSync();
    ensureOfflineMapUpload();
    collapseSupportSections();
    ensureOfflineMapUpload();
    document.body.dataset.cleanDisplayApplying = "false";
  }

  function installObserver(){
    const sidebar = document.getElementById("sidebar");
    if(!sidebar || sidebar.dataset.cleanDisplayObserver) return;
    sidebar.dataset.cleanDisplayObserver = "true";
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if(scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyCleanDisplay();
      });
    });
    observer.observe(sidebar, {childList:true, characterData:true, subtree:true});
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyCleanDisplay();
    installObserver();
    installBoundaryGateEvents();
    [250, 900, 1800, 3500].forEach(delay => setTimeout(applyCleanDisplay, delay));
  });

  window.CropCollectorCleanDisplay = { apply: applyCleanDisplay };
})();
