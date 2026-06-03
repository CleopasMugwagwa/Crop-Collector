
/* GEOMETRY CAPTURE FIX v650
   Captures Leaflet.draw geometry and exposes it to offline-sync-engine.js. */
(function(){
  "use strict";

  function saveGeometry(geometry, source){
    if(!geometry || !geometry.type || geometry.coordinates === undefined) return;
    window.currentGeometry = geometry;
    window.selectedGeometry = geometry;
    window.drawnGeometry = geometry;
    window.lastDrawnGeometry = geometry;
    try{
      localStorage.setItem("crop_collector_last_geometry", JSON.stringify({
        geometry: geometry,
        source: source || "unknown",
        saved_at: new Date().toISOString()
      }));
    }catch(error){}
  }

  function layerToGeometry(layer){
    try{
      if(layer && typeof layer.toGeoJSON === "function"){
        const gj = layer.toGeoJSON();
        if(gj && gj.type === "Feature" && gj.geometry) return gj.geometry;
        if(gj && gj.type && gj.coordinates) return gj;
      }
    }catch(error){}
    return null;
  }

  function captureFromDrawEvent(event){
    const layer = event && (event.layer || event.target);
    const geometry = layerToGeometry(layer);
    if(geometry) saveGeometry(geometry, "leaflet-draw-event");
  }

  function captureFromLayerGroup(group){
    try{
      if(!group || typeof group.toGeoJSON !== "function") return null;
      const gj = group.toGeoJSON();
      if(gj && gj.type === "FeatureCollection" && gj.features && gj.features.length){
        const feature = gj.features[gj.features.length - 1];
        if(feature && feature.geometry){
          saveGeometry(feature.geometry, "leaflet-layer-group");
          return feature.geometry;
        }
      }
    }catch(error){}
    return null;
  }

  function scanGlobals(){
    const names = [
      "drawnItems","drawnLayer","drawLayer","editableLayers","featureGroup",
      "drawnFeatureGroup","fieldBoundaryLayer","selectedLayer","currentLayer"
    ];

    for(const name of names){
      const obj = window[name];
      const direct = layerToGeometry(obj);
      if(direct){
        saveGeometry(direct, "window." + name);
        return direct;
      }
      const grouped = captureFromLayerGroup(obj);
      if(grouped) return grouped;
    }

    try{
      const cached = JSON.parse(localStorage.getItem("crop_collector_last_geometry") || "null");
      if(cached && cached.geometry) return cached.geometry;
    }catch(error){}

    return null;
  }

  function patchLeafletFire(){
    if(!window.L || !L.Evented || L.Evented.prototype.__geometryCapturePatched) return;
    const originalFire = L.Evented.prototype.fire;
    L.Evented.prototype.fire = function(type, data, propagate){
      try{
        if(type === "draw:created" || type === "draw:edited" || type === "draw:drawstop"){
          captureFromDrawEvent(data || {});
          scanGlobals();
        }
      }catch(error){}
      return originalFire.call(this, type, data, propagate);
    };
    L.Evented.prototype.__geometryCapturePatched = true;
  }

  function patchMapEvents(){
    try{
      if(!window.L || !L.Map || L.Map.prototype.__geometryCaptureInitPatched) return;
      const originalInit = L.Map.prototype.initialize;
      L.Map.prototype.initialize = function(){
        originalInit.apply(this, arguments);
        try{
          this.on("draw:created", captureFromDrawEvent);
          this.on("draw:edited", function(){ setTimeout(scanGlobals, 50); });
          this.on("draw:deleted", function(){
            window.currentGeometry = null;
            window.selectedGeometry = null;
            window.drawnGeometry = null;
            window.lastDrawnGeometry = null;
            try{ localStorage.removeItem("crop_collector_last_geometry"); }catch(error){}
          });
        }catch(error){}
      };
      L.Map.prototype.__geometryCaptureInitPatched = true;
    }catch(error){}
  }

  function boot(){
    patchLeafletFire();
    patchMapEvents();
    scanGlobals();
    setInterval(scanGlobals, 2500);
  }

  window.CropCollectorGeometryCapture = {
    saveGeometry: saveGeometry,
    scanGlobals: scanGlobals,
    layerToGeometry: layerToGeometry
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();
