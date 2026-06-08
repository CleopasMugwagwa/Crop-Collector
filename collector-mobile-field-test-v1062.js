(function(){
  "use strict";

  function isMobile(){
    return window.innerWidth < 900;
  }

  function hasPolygon(){
    try{
      const layer = window.CropCollectorApp?.state?.get?.("selectedPolygon") || window.selectedPolygon;
      const geometry = layer?.toGeoJSON?.().geometry;
      return !!(geometry && geometry.type === "Polygon" && geometry.coordinates);
    }catch{
      return false;
    }
  }

  function openMapWorkspace(){
    if(!isMobile()) return;
    window.setMobileWorkspace?.("map");
    setTimeout(() => {
      try{
        const map = window.collectorMap || window.map;
        map?.invalidateSize?.();
      }catch(error){}
    }, 180);
  }

  function showMapGuidance(){
    const message = "For crop records: open Map, tap GPS, wait for a fix, then draw the field polygon.";
    try{
      window.showCollectorFeedback?.(message, "info", {sticky:false, revealCollect:false});
    }catch(error){}
    const bannerTitle = document.getElementById("map-workflow-title");
    const bannerMessage = document.getElementById("map-workflow-message");
    if(bannerTitle) bannerTitle.textContent = "Draw crop boundary";
    if(bannerMessage) bannerMessage.textContent = "Tap GPS first. If the map background is blank, switch basemap to OpenStreetMap or load MBTiles.";
  }

  function configurePointTool(){
    const button = document.getElementById("mobile-draw-point-btn");
    if(!button || button.dataset.pointTool === "true") return;
    button.dataset.pointTool = "true";
    button.setAttribute("aria-label", "Add point");
    button.setAttribute("title", "Add a reference point");
    const icon = button.querySelector("i");
    const label = button.querySelector("span");
    if(icon) icon.setAttribute("data-feather", "map-pin");
    if(label) label.textContent = "Point";
    window.feather?.replace?.();
  }

  function ensureDrawPrompt(){
    const guidance = document.getElementById("collector-draw-guidance");
    if(!guidance || guidance.dataset.mobileFieldReady === "true") return;
    guidance.dataset.mobileFieldReady = "true";
    guidance.innerHTML = `
      <strong>Draw field boundary first.</strong>
      <span>Open the map, tap GPS, wait for location, then draw the field polygon.</span>
      <button type="button" id="open-map-draw-boundary" class="secondary">Open Map to Draw Boundary</button>
      <small>If Google Hybrid is blank on this network, choose OpenStreetMap or load MBTiles.</small>
    `;
    document.getElementById("open-map-draw-boundary")?.addEventListener("click", () => {
      openMapWorkspace();
      showMapGuidance();
    });
  }

  function hideSecondPlotWhenNoPolygon(){
    const nextPlot = document.getElementById("save-next-plot-btn");
    const module = document.body.dataset.collectorPrimaryModule || window.activeCollectorPrimaryModule || "";
    if(nextPlot && module === "crop" && !hasPolygon()){
      nextPlot.style.display = "none";
      nextPlot.hidden = true;
    }
  }

  function installEvents(){
    if(window.__collectorMobileFieldTestV1062) return;
    window.__collectorMobileFieldTestV1062 = true;

    document.addEventListener("click", event => {
      if(event.target.closest("#collector-open-crop")){
        setTimeout(() => {
          openMapWorkspace();
          showMapGuidance();
        }, 350);
      }

      if(event.target.closest("#mobile-draw-polygon-btn,.leaflet-draw-draw-polygon")){
        openMapWorkspace();
        showMapGuidance();
      }

      if(event.target.closest("#mobile-draw-point-btn,.leaflet-draw-draw-marker")){
        openMapWorkspace();
        const bannerTitle = document.getElementById("map-workflow-title");
        const bannerMessage = document.getElementById("map-workflow-message");
        if(bannerTitle) bannerTitle.textContent = "Add reference point";
        if(bannerMessage) bannerMessage.textContent = "Tap the correct crop reference or livestock location on the map.";
      }

      if(event.target.closest("#select-polygon-btn")){
        event.preventDefault();
        openMapWorkspace();
        showMapGuidance();
      }
    }, true);
  }

  function preferOpenStreetMapOnMobile(){
    if(!isMobile()) return;
    const selector = document.getElementById("basemap-selector");
    if(!selector || selector.dataset.mobileDefaultChecked === "true") return;
    selector.dataset.mobileDefaultChecked = "true";
    if(selector.value === "google_hybrid"){
      selector.value = "osm";
      selector.dispatchEvent(new Event("change", {bubbles:true}));
    }
  }

  function tick(){
    configurePointTool();
    ensureDrawPrompt();
    hideSecondPlotWhenNoPolygon();
    preferOpenStreetMapOnMobile();
  }

  function boot(){
    installEvents();
    tick();
    [300, 1000, 2500].forEach(delay => setTimeout(tick, delay));
    setInterval(tick, 2500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
