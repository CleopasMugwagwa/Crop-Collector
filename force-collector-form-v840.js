
/* FORCE COLLECTOR FORM v840 - last-resort stable form display */
(function(){
  "use strict";
  if(window.__forceCollectorFormV840Loaded) return;
  window.__forceCollectorFormV840Loaded = true;

  var ORIGINAL_FORM_HTML = `
        <div class="input-group">
          <input type="text" id="survey-name" name="survey_name" placeholder=" " required>
          <label for="survey-name">Survey Name</label>
        </div>
        <div class="input-group">
          <input type="text" id="owner-name" name="owner_name" placeholder=" " required>
          <label for="owner-name">Farmer / Owner Name</label>
        </div>
        <div class="input-group">
          <input type="text" id="farm-name" name="farm_name" placeholder=" ">
          <label for="farm-name">Farm Name</label>
        </div>
        <div class="input-group" id="location-group" style="display:none" hidden aria-hidden="true">
          <input type="hidden" id="location-name" name="location_name" placeholder=" ">
        </div>
        <input type="hidden" id="capture-type" name="capture_type" value="polygon">
        <div class="input-group">
          <select id="sector" name="sector" required>
            <option value="" disabled selected></option>
            <option value="Large">Large</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="Other">Other</option>
          </select>
          <label for="sector">Sector</label>
        </div>
        <div class="input-group">
          <select id="crop-type" name="crop_type" required>
            <option value="" disabled selected></option>
            <optgroup label="Major Cash Crops">
              <option value="tobacco">Tobacco</option>
              <option value="cotton">Cotton</option>
              <option value="maize">Maize (Chibage)</option>
              <option value="wheat">Wheat</option>
              <option value="sorghum">Sorghum</option>
              <option value="millet">Millet</option>
              <option value="cassava">Cassava</option>
            </optgroup>
            <optgroup label="Minor Cash Crops">
              <option value="groundnuts">Groundnuts</option>
              <option value="sunflower">Sunflower</option>
              <option value="sugar_cane">Sugar Cane</option>
              <option value="coffee">Coffee</option>
              <option value="tea">Tea</option>
              <option value="soybeans">Soybeans</option>
              <option value="sesame">Sesame</option>
            </optgroup>
            <optgroup label="Horticulture and Vegetables">
              <option value="citrus">Citrus</option>
              <option value="avocado">Avocado</option>
              <option value="mango">Mango</option>
              <option value="banana">Banana</option>
              <option value="tomatoes">Tomatoes</option>
              <option value="onions">Onions</option>
              <option value="potatoes">Potatoes</option>
              <option value="cabbage">Cabbage</option>
              <option value="spinach">Spinach</option>
              <option value="sweet_potato">Sweet Potato</option>
              <option value="okra">Okra</option>
              <option value="Eggplant">Eggplant</option>
            </optgroup>
            <optgroup label="Other Crops">
              <option value="other">Other</option>
            </optgroup>
          </select>
          <label for="crop-type">Crop Type</label>
        </div>
        <div class="input-group">
          <select id="growth-stage" name="growth_stage" required>
            <option value="planting" selected>Planting</option>
            <option value="germination">Germination</option>
            <option value="vegetative">Vegetative</option>
            <option value="flowering">Flowering</option>
            <option value="maturity">Maturity</option>
            <option value="harvested">Harvested</option>
          </select>
          <label for="growth-stage">Growth Stage</label>
        </div>
        <div class="input-group">
          <select id="crop-condition" name="crop_condition">
            <option value="" selected></option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
          <label for="crop-condition">Crop Condition</label>
        </div>
        <div class="input-group">
          <select id="season" name="season">
            <option value="" selected></option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
            <option value="Autumn">Autumn</option>
            <option value="Spring">Spring</option>
          </select>
          <label for="season">Season</label>
        </div>
        <div class="input-group">
          <select id="irrigation-type" name="irrigation_type">
            <option value="" selected></option>
            <option value="Rainfed">Rainfed</option>
            <option value="Irrigated">Irrigated</option>
            <option value="Supplementary">Supplementary</option>
          </select>
          <label for="irrigation-type">Irrigation</label>
        </div>
        <div class="input-group">
          <input type="date" id="planting-date" name="planting_date" placeholder=" ">
          <label for="planting-date">Planting Date</label>
        </div>
        <div class="input-group">
          <input type="number" step="0.01" id="yield-expected" name="yield_expected" placeholder=" ">
          <label for="yield-expected">Yield Expected (tonnes)</label>
        </div>
        <div class="input-group">
          <input type="date" id="harvest-date" name="harvest_date" placeholder=" ">
          <label for="harvest-date">Harvest Date</label>
        </div>
        <div class="input-group">
          <input type="number" step="0.01" id="yield-tonnes" name="yield_tonnes" placeholder=" ">
          <label for="yield-tonnes">Yield in Tonnes</label>
        </div>
        <div class="input-group">
          <textarea id="observation-notes" name="observation_notes" rows="2" placeholder=" "></textarea>
          <label for="observation-notes">Observation Notes</label>
        </div>
        <div class="input-group">
          <textarea id="post-harvest-assessment" name="post_harvest_assessment" rows="2" placeholder=" "></textarea>
          <label for="post-harvest-assessment">Post Harvest Assessment</label>
        </div>
        <div class="input-group">
          <textarea id="notes" name="notes" rows="3" placeholder=" "></textarea>
          <label for="notes">Notes</label>
        </div>
        <button type="submit" id="save-entry-btn"><i data-feather="save"></i> Save Entry</button>
        <button type="button" id="remove-shape-btn" class="danger" style="display:none;margin-top:10px"><i data-feather="trash-2"></i> Delete Mistake</button>
        <button type="button" id="cancel-edit-btn" class="secondary" style="display:none;margin-top:10px"><i data-feather="x-circle"></i> Cancel Edit</button>
        <button type="button" id="select-polygon-btn" class="warning" style="display:none;margin-top:10px"><i data-feather="map-pin"></i> Select Polygon First</button>
      `;

  function qsa(s,r){return Array.from((r||document).querySelectorAll(s));}
  function hide(el){if(el){el.hidden=true;el.style.setProperty("display","none","important");}}
  function show(el,display){if(el){el.hidden=false;el.removeAttribute("hidden");el.removeAttribute("aria-hidden");el.style.setProperty("display",display||"block","important");el.style.setProperty("visibility","visible","important");el.style.setProperty("opacity","1","important");el.style.setProperty("height","","important");el.style.setProperty("max-height","none","important");el.style.setProperty("overflow","visible","important");}}
  function txt(el){return (el&&el.textContent?el.textContent:"").replace(/\s+/g," ").trim().toLowerCase();}

  function surveyName(){
    var el=document.getElementById("survey-name")||document.querySelector("[name='survey_name']");
    return el&&el.value?String(el.value).trim():"";
  }

  function choiceHTML(){
    var value = surveyName().replace(/"/g,"&quot;");
    return `
      <div class="input-group force-survey-name-v840">
        <input type="text" id="survey-name" name="survey_name" placeholder=" " required value="${value}">
        <label for="survey-name">Survey Name</label>
      </div>
      <div id="force-survey-buttons-v840">
        <button type="button" id="force-start-crop-v840">Crop Survey</button>
        <button type="button" id="force-start-livestock-v840">Livestock Survey</button>
      </div>
    `;
  }

  function ensureContainer(){
    var collect=document.getElementById("collect-form");
    var form=document.getElementById("crop-form");
    if(!collect) return null;
    show(collect,"block");
    if(!form){
      form=document.createElement("form");
      form.id="crop-form";
      form.setAttribute("novalidate","");
      collect.appendChild(form);
    }
    show(form,"block");
    return form;
  }

  function mountChoice(){
    var form=ensureContainer();
    if(!form || document.body.classList.contains("force-module-started-v840")) return;
    form.innerHTML=choiceHTML();
    bindButtons();
  }

  function openFullForm(module){
    var form=ensureContainer();
    if(!form) return;
    var name=surveyName();
    document.body.classList.add("force-module-started-v840");
    document.body.dataset.collectorPrimaryModule=module||"crop";
    window.selectedSurveyType=module||"crop";
    window.effectiveModule=module||"crop";

    form.innerHTML=ORIGINAL_FORM_HTML;
    var sv=document.getElementById("survey-name");
    if(sv && name) sv.value=name;
    revealFields();

    try{ if(window.feather) feather.replace(); }catch(e){}
    try{ if(window.ensureCollectorSurveyReady) window.ensureCollectorSurveyReady({requestedModule:module||"crop", advance:false, silent:true}); }catch(e){}
  }

  function revealFields(){
    var form=document.getElementById("crop-form");
    if(!form) return;
    show(document.getElementById("collect-form"),"block");
    show(form,"block");
    qsa(".input-group",form).forEach(function(g){
      if(g.id==="location-group" || g.querySelector("#location-name,input[type='hidden']")) hide(g);
      else show(g,"block");
    });
    qsa("input,select,textarea,label",form).forEach(function(el){
      if(el.type==="hidden") return;
      show(el, el.tagName==="LABEL"?"block":"");
    });
    show(document.getElementById("save-entry-btn"),"flex");
    hide(document.getElementById("remove-shape-btn"));
    hide(document.getElementById("cancel-edit-btn"));
    hide(document.getElementById("select-polygon-btn"));
  }

  function bindButtons(){
    var c=document.getElementById("force-start-crop-v840");
    var l=document.getElementById("force-start-livestock-v840");
    if(c && c.dataset.bound!=="1"){c.dataset.bound="1";c.addEventListener("click",function(){openFullForm("crop");},false);}
    if(l && l.dataset.bound!=="1"){l.dataset.bound="1";l.addEventListener("click",function(){openFullForm("livestock");},false);}
  }

  function hideNoise(){
    hide(document.getElementById("collector-quick-menu"));
    qsa("#collector-feedback,.collector-feedback,#save-flow-card,.save-flow-card,#geometry-edit-status,#save-action-stack,.save-action-stack,.quick-menu-note,#required-progress,#completion-status,#next-questions,#quality-score,.progress-card,.form-progress,.question-progress,.step-progress,.quality-card,.quality-score-card").forEach(hide);
    qsa("#sidebar .section").forEach(function(sec){
      var t=txt(sec.querySelector("h2"));
      var offline=t.includes("offline")||t.includes("basemap")||t.includes("mbtiles");
      var sync=t.includes("offline save")||t.includes("sync");
      var hideSec=t.includes("entries")||t.includes("settings")||t.includes("operations")||t.includes("field readiness")||sync;
      if(hideSec && !(offline&&!sync)) hide(sec);
      if(offline&&!sync){
        sec.classList.add("force-offline-v840");
        var h=sec.querySelector("h2");
        if(h && h.dataset.forceBound!=="1"){h.dataset.forceBound="1";h.addEventListener("click",function(){sec.classList.toggle("offline-open");},false);}
      }
    });
  }

  function repair(){
    document.body.classList.add("collector-final-layout");
    hideNoise();
    if(document.body.classList.contains("force-module-started-v840")) revealFields();
    else mountChoice();
    try{if(window.map&&window.map.invalidateSize)window.map.invalidateSize();if(window.collectorMap&&window.collectorMap.invalidateSize)window.collectorMap.invalidateSize();}catch(e){}
  }

  window.addEventListener("error",function(ev){
    var m=String(ev.message||"");
    if(m.includes("displayName")||m.includes("insertAdjacentElement")||m.includes("insertBefore")||m.includes("HierarchyRequestError")||m.includes("Cannot set properties")){
      ev.preventDefault(); setTimeout(repair,50); return true;
    }
  },true);

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",repair,{once:true});
  else repair();
  setTimeout(repair,300);
  setTimeout(repair,800);
  setTimeout(repair,1500);
  setTimeout(repair,2500);
  setInterval(repair,3000);
})();
