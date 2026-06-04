function getHostedApiBase(){
  if(window.CROP_COLLECTOR_API_BASE) return window.CROP_COLLECTOR_API_BASE;
  const host = window.location.hostname || '127.0.0.1';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  if(!isLocal) return 'https://crop-collector-backend.onrender.com/api/v1';
  return `http://${host === 'localhost' ? '127.0.0.1' : host}:8000/api/v1`;
}
const API_HOST=window.location.hostname||'127.0.0.1';
const API_URL=getHostedApiBase();
const ACCESS_TOKEN_KEY='access_token';
const LOCAL_QUEUE_KEY='local_field_entries_queue';
const SYNC_HISTORY_KEY='sync_event_history';
const LEGACY_GUEST_KEY='guest_field_entries';
const LAST_SURVEY_NAME_KEY='last_survey_name';const SURVEY_CACHE_KEY='survey_catalog_cache';const LOOKUP_CACHE_KEY='lookup_catalog_cache';const APP_STATE_VERSION_KEY='crop_collector_app_version';const DEVICE_ID_KEY='crop_collector_device_id';const PORTRAIT_LOCK_KEY='crop_collector_portrait_lock';const QUESTIONNAIRE_SECTION_STATE_KEY='collector_questionnaire_sections';// legacy smoke marker: APP_VERSION='2.9.18-map-mbtiles-survey-cache'
const APP_VERSION='2.9.67-map-mbtiles-survey-fix';
const SQLJS_CANDIDATES=[{script:'vendor/sqljs/sql-wasm.js',wasmBase:'vendor/sqljs/'}];
const SIDEBAR_SECTION_STATE_KEY='collector_sidebar_sections';
let serverInfo=null;
let lastSyncMessage='No sync yet';
let syncHistory=JSON.parse(localStorage.getItem(SYNC_HISTORY_KEY)||'[]');
let accessToken=localStorage.getItem(ACCESS_TOKEN_KEY);
let currentUser=null,map,currentBasemap,drawnItems,drawControl=null,selectedPolygon=null,selectedEntryId=null,editingEntryId=null,editGeometryReplaced=false,fieldEntries=[],slideIndex=0,slideTimer,mbtilesDb=null,mbtilesLayer=null,SQLRef=null,availableSurveys=[],availableSurveyConfigs={},currentLocationMarker=null,currentLocationAccuracyCircle=null,currentLocationLatLng=null,autoLocationRequested=false,validationGeometryFilter='all',saveNextPlotForFarmer=false,activeFarmerGroupId=null,activeFarmerPlotNumber=1,activeFarmerContextKey='',activeFarmerSummaryDraft=null,lastSavedFarmerChain=null,mapInteractionLocked=false,farmerGroupExpanded={},selectedFarmerGroupKey=null,mobileWorkspace='map',lastSidebarWorkspace='collect',portraitLockPreferred=localStorage.getItem(PORTRAIT_LOCK_KEY)==='true',collectorFeedbackTimer=null,mapWorkflowMode='idle',mobilePostDrawRevealTimer=null,mobilePostDrawRevealUntil=0,activeCollectorPrimaryModule=null,collectorWizardPhase='core',currentCollectorWizardStep=0,currentCropPlan=[],currentCropPlanIndex=0,preserveCropPlanOnReset=false;
let lookupCatalog={};
const lookupLabelMaps={};
const cropLabels={};
const ZIMBABWE_GEOGRAPHY={"Bulawayo Metropolitan":["Bulawayo"],"Harare Metropolitan":["Harare","Chitungwiza","Epworth"],"Manicaland":["Buhera","Chimanimani","Chipinge","Makoni","Mutare","Mutasa","Nyanga"],"Mashonaland Central":["Bindura","Guruve","Mazowe","Mbire","Mount Darwin","Muzarabani","Rushinga","Shamva"],"Mashonaland East":["Chikomba","Goromonzi","Hwedza","Marondera","Mudzi","Murehwa","Mutoko","Seke","Uzumba-Maramba-Pfungwe"],"Mashonaland West":["Chegutu","Hurungwe","Kariba","Makonde","Mhondoro-Ngezi","Sanyati","Zvimba"],"Masvingo":["Bikita","Chiredzi","Chivi","Gutu","Masvingo","Mwenezi","Zaka"],"Matabeleland North":["Binga","Bubi","Hwange","Lupane","Nkayi","Tsholotsho","Umguza"],"Matabeleland South":["Beitbridge","Bulilima","Gwanda","Insiza","Mangwe","Matobo","Umzingwane"],"Midlands":["Chirumanzu","Gokwe North","Gokwe South","Gweru","Kwekwe","Mberengwa","Shurugwi","Zvishavane"]};
const DB_NAME = 'CropCollectorDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlineQueue';
const CollectorApp=window.CropCollectorApp||(window.CropCollectorApp={});
CollectorApp.config={apiHost:API_HOST,apiUrl:API_URL,appVersion:APP_VERSION,dbName:DB_NAME,dbVersion:DB_VERSION,storeName:STORE_NAME};
CollectorApp.modules=CollectorApp.modules||{};
CollectorApp.registerModule=function registerCollectorModule(name,api){
  CollectorApp.modules[name]={...(CollectorApp.modules[name]||{}),...(api||{})};
  return CollectorApp.modules[name];
};
CollectorApp.getModule=function getCollectorModule(name){
  return CollectorApp.modules[name]||null;
};
function bindCollectorStateProperty(target,key,getter,setter){
  Object.defineProperty(target,key,{
    configurable:true,
    enumerable:true,
    get:getter,
    set:setter
  });
}
CollectorApp.state=CollectorApp.state||{};
[
  ['serverInfo',()=>serverInfo,value=>{serverInfo=value;}],
  ['lastSyncMessage',()=>lastSyncMessage,value=>{lastSyncMessage=value;}],
  ['syncHistory',()=>syncHistory,value=>{syncHistory=value;}],
  ['accessToken',()=>accessToken,value=>{accessToken=value;}],
  ['currentUser',()=>currentUser,value=>{currentUser=value;}],
  ['map',()=>map,value=>{map=value;}],
  ['currentBasemap',()=>currentBasemap,value=>{currentBasemap=value;}],
  ['drawnItems',()=>drawnItems,value=>{drawnItems=value;}],
  ['drawControl',()=>drawControl,value=>{drawControl=value;}],
  ['selectedPolygon',()=>selectedPolygon,value=>{selectedPolygon=value;}],
  ['selectedEntryId',()=>selectedEntryId,value=>{selectedEntryId=value;}],
  ['editingEntryId',()=>editingEntryId,value=>{editingEntryId=value;}],
  ['editGeometryReplaced',()=>editGeometryReplaced,value=>{editGeometryReplaced=value;}],
  ['fieldEntries',()=>fieldEntries,value=>{fieldEntries=value;}],
  ['mbtilesDb',()=>mbtilesDb,value=>{mbtilesDb=value;}],
  ['mbtilesLayer',()=>mbtilesLayer,value=>{mbtilesLayer=value;}],
  ['SQLRef',()=>SQLRef,value=>{SQLRef=value;}],
  ['availableSurveys',()=>availableSurveys,value=>{availableSurveys=value;}],
  ['availableSurveyConfigs',()=>availableSurveyConfigs,value=>{availableSurveyConfigs=value||{};}],
  ['currentLocationLatLng',()=>currentLocationLatLng,value=>{currentLocationLatLng=value;}],
  ['validationGeometryFilter',()=>validationGeometryFilter,value=>{validationGeometryFilter=value;}],
  ['saveNextPlotForFarmer',()=>saveNextPlotForFarmer,value=>{saveNextPlotForFarmer=value;}],
  ['activeFarmerGroupId',()=>activeFarmerGroupId,value=>{activeFarmerGroupId=value;}],
  ['activeFarmerPlotNumber',()=>activeFarmerPlotNumber,value=>{activeFarmerPlotNumber=value;}],
  ['activeFarmerContextKey',()=>activeFarmerContextKey,value=>{activeFarmerContextKey=value;}],
  ['activeFarmerSummaryDraft',()=>activeFarmerSummaryDraft,value=>{activeFarmerSummaryDraft=value;}],
  ['lastSavedFarmerChain',()=>lastSavedFarmerChain,value=>{lastSavedFarmerChain=value;}],
  ['mapInteractionLocked',()=>mapInteractionLocked,value=>{mapInteractionLocked=value;}],
  ['farmerGroupExpanded',()=>farmerGroupExpanded,value=>{farmerGroupExpanded=value;}],
  ['selectedFarmerGroupKey',()=>selectedFarmerGroupKey,value=>{selectedFarmerGroupKey=value;}],
  ['mobileWorkspace',()=>mobileWorkspace,value=>{mobileWorkspace=value;}],
  ['lastSidebarWorkspace',()=>lastSidebarWorkspace,value=>{lastSidebarWorkspace=value;}],
  ['portraitLockPreferred',()=>portraitLockPreferred,value=>{portraitLockPreferred=value;}],
  ['mapWorkflowMode',()=>mapWorkflowMode,value=>{mapWorkflowMode=value;}],
  ['mobilePostDrawRevealUntil',()=>mobilePostDrawRevealUntil,value=>{mobilePostDrawRevealUntil=value;}],
  ['activeCollectorPrimaryModule',()=>activeCollectorPrimaryModule,value=>{activeCollectorPrimaryModule=value;}],
  ['collectorWizardPhase',()=>collectorWizardPhase,value=>{collectorWizardPhase=value;}],
  ['currentCollectorWizardStep',()=>currentCollectorWizardStep,value=>{currentCollectorWizardStep=value;}],
  ['currentCropPlan',()=>currentCropPlan,value=>{currentCropPlan=value;}],
  ['currentCropPlanIndex',()=>currentCropPlanIndex,value=>{currentCropPlanIndex=value;}],
  ['preserveCropPlanOnReset',()=>preserveCropPlanOnReset,value=>{preserveCropPlanOnReset=value;}],
  ['lookupCatalog',()=>lookupCatalog,value=>{lookupCatalog=value;}],
  ['localQueueInMemory',()=>localQueueInMemory,value=>{localQueueInMemory=value;}]
].forEach(([key,getter,setter])=>bindCollectorStateProperty(CollectorApp.state,key,getter,setter));
CollectorApp.state.get=function getCollectorStateValue(key){
  return CollectorApp.state[key];
};
CollectorApp.state.set=function setCollectorStateValue(key,value){
  CollectorApp.state[key]=value;
  return value;
};
CollectorApp.state.assign=function assignCollectorState(values={}){
  Object.entries(values).forEach(([key,value])=>{
    if(key in CollectorApp.state)CollectorApp.state[key]=value;
  });
  return CollectorApp.state;
};
CollectorApp.services=CollectorApp.services||{};
CollectorApp.services.getLookupLabel=(...args)=>getLookupLabel(...args);
CollectorApp.services.getLookupCode=(...args)=>getLookupCode(...args);
CollectorApp.services.getCollectorDeviceId=()=>getCollectorDeviceId();
CollectorApp.services.updateOfflineStatus=(...args)=>updateOfflineStatus(...args);
CollectorApp.services.showCollectorFeedback=(...args)=>showCollectorFeedback(...args);
CollectorApp.services.ensureCollectorSurveyReady=(...args)=>ensureCollectorSurveyReady(...args);
CollectorApp.services.getSelectedSurveyConfig=()=>getSelectedSurveyConfig();
CollectorApp.services.openInitialScreenFromUrl=()=>openInitialScreenFromUrl();
window.inferPrimaryModule=window.inferPrimaryModule||function inferPrimaryModuleFallback(entry={}){
  const explicit=String(
    entry?.primaryModule||
    entry?.primary_module||
    entry?.module||
    entry?.surveyType||
    entry?.survey_type||
    entry?.captureModule||
    ''
  ).trim().toLowerCase();
  if(explicit.includes('livestock'))return 'livestock';
  if(explicit.includes('crop'))return 'crop';

  const cropCode=String(entry?.cropType||entry?.crop_type||'').trim().toLowerCase();
  const cropLabel=String(entry?.cropName||entry?.crop_type_label||'').trim().toLowerCase();
  const captureType=String(entry?.captureType||entry?.capture_type||'').trim().toLowerCase();
  const livestockModules=Array.isArray(entry?.livestockModules||entry?.livestock_modules)
    ? (entry.livestockModules||entry.livestock_modules)
    : [];

  if(cropCode.includes('livestock')||cropLabel.includes('livestock'))return 'livestock';
  if(livestockModules.length)return 'livestock';
  if(captureType==='point' && !cropCode && !cropLabel && !entry?.geometry)return 'livestock';

  return 'crop';
};
window.getWorkflowState=window.getWorkflowState||function getWorkflowStateFallback(entry={}){
  if(entry?.isArchived||entry?.archivedAt)return 'archived';
  if(entry?.source==='local'){
    if(entry?.syncStatus==='failed')return 'local-failed';
    if(entry?.syncStatus==='pending')return 'local-pending';
    return 'local-ready';
  }
  if(entry?.reviewStatus && entry.reviewStatus!=='pending_review')return entry.reviewStatus;
  if(entry?.validationStatus && entry.validationStatus!=='uncertain')return entry.validationStatus;
  if(entry?.syncStatus==='synced' || entry?.source==='backend')return 'synced';
  return 'draft';
};
window.formatWorkflowLabel=window.formatWorkflowLabel||function formatWorkflowLabelFallback(state='draft'){
  return String(state||'draft')
    .replace(/[_-]+/g,' ')
    .replace(/\b\w/g,(letter)=>letter.toUpperCase());
};
window.workflowBadgeMarkup=window.workflowBadgeMarkup||function workflowBadgeMarkupFallback(entry={}){
  const state=window.getWorkflowState?.(entry)||'draft';
  const label=window.formatWorkflowLabel?.(state)||'Draft';
  const tone=
    /archived/i.test(state)?'warning':
    /(fail|rejected)/i.test(state)?'error':
    /(synced|approved|validated|reviewed)/i.test(state)?'success':
    'info';
  return `<span class="source-badge workflow-badge workflow-${tone}">${label}</span>`;
};
window.renderTraceabilityGrid=window.renderTraceabilityGrid||function renderTraceabilityGridFallback(entry={}){
  const rows=[
    ['Source', entry?.source||'-'],
    ['Sync Status', entry?.syncStatus||'-'],
    ['Local ID', entry?.localId||'-'],
    ['Server ID', entry?.id||'-'],
    ['Updated By', entry?.updatedBy||'-'],
    ['Last Action', entry?.lastAction||'-'],
    ['Last Action At', entry?.lastActionAt||'-'],
    ['Synced At', entry?.serverSyncedAt||'-'],
    ['Validated By', entry?.validatedBy||'-'],
    ['Reviewed By', entry?.reviewedBy||'-']
  ].filter(([,value])=>String(value||'-').trim()!=='');
  return `<div class="traceability-grid">${rows.map(([label,value])=>`<div><strong>${label}:</strong> ${value}</div>`).join('')}</div>`;
};
window.updateCollectorSubmitButtons=window.updateCollectorSubmitButtons||function updateCollectorSubmitButtonsFallback(finalStep=false){const saveBtn=document.getElementById('save-entry-btn');const nextPlotBtn=document.getElementById('save-next-plot-btn');const canOfferAnotherPlot=finalStep&&window.activeCollectorPrimaryModule==='crop'&&!window.editingEntryId;if(saveBtn)saveBtn.innerHTML=finalStep?'<i data-feather="check-circle"></i> Submit & Finish':'<i data-feather="save"></i> Save Entry';if(nextPlotBtn){nextPlotBtn.innerHTML=finalStep?'<i data-feather="plus-circle"></i> Submit & Add Another Plot':'<i data-feather="plus-circle"></i> Save & Add Another Plot';nextPlotBtn.style.display=canOfferAnotherPlot?'flex':'none'}};
window.getCropPlanLabel=window.getCropPlanLabel||function getCropPlanLabelFallback(value){const option=[...document.querySelectorAll('#crop-type option')].find(node=>node.value===value);return option?.textContent?.trim()||String(value||'')};
window.goSlide=window.goSlide||function goSlideFallback(index=0){const slides=[...document.querySelectorAll('.slide')];const dots=[...document.querySelectorAll('.slide-dot')];if(!slides.length)return;slideIndex=((Number(index)||0)%slides.length+slides.length)%slides.length;slides.forEach((slide,idx)=>slide.classList.toggle('active',idx===slideIndex));dots.forEach((dot,idx)=>dot.classList.toggle('active',idx===slideIndex))};
window.setupSlides=window.setupSlides||function setupSlidesFallback(){const slides=[...document.querySelectorAll('.slide')];if(!slides.length)return;if(slideTimer)clearInterval(slideTimer);window.goSlide?.(0);if(slides.length>1){slideTimer=setInterval(()=>window.goSlide?.((slideIndex+1)%slides.length),5000)}};
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}
let localQueueInMemory = [];
async function initLocalQueueFromIndexedDB() {
  try {
    const db = await openQueueDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('queue');
      request.onsuccess = (e) => {
        const val = e.target.result;
        localQueueInMemory = val ? val.data : [];
        if (localQueueInMemory.length === 0) {
          const legacy = localStorage.getItem(LOCAL_QUEUE_KEY);
          if (legacy) {
            localQueueInMemory = JSON.parse(legacy);
            saveQueueToIndexedDB(localQueueInMemory);
          }
        }
        resolve();
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to init IndexedDB, falling back to localStorage:', err);
    localQueueInMemory = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]');
  }
}
async function saveQueueToIndexedDB(items) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ key: 'queue', data: items });
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
  }
}
async function bootCollectorApp(){
  await initLocalQueueFromIndexedDB();
  applyAppVersionMigrations();
  registerCollectorRuntimeGuards();
  feather.replace();
  const restoredEarly=await restoreSession();
  initCropLabels();
  ensureSurveyNameSelect();
  injectAdministrativeFields();
  injectMinistrySummaryFields();
  injectPlotAgronomyFields();
  injectFieldEnhancements();
  injectDrawingActionButtons();
  injectFarmerSummaryPanel();
  injectFarmerDetailPanel();
  injectValidationEnhancements();
  injectCollectorQuickMenu();
  injectCollectorSettingsPanel();
  injectMobileWorkspaceDock();
  injectCollectorSubmenus();
  injectMbtilesFallbackPicker();
  injectReferenceDataTools();
  injectCollectorFormSteps();
  injectCropPlanSelector();
  injectCollectorQuestionnaireSections();
  injectCollectorPrimaryModules();
  initGeographySelectors();
  bindUI();
  // Signup is now enabled - no need to hide signup UI
  // enforceProvisionedAccessUI();
  restoreLastSurveyName();
  window.initSidebarSections?.();
  setupSlides();
  migrateLegacyQueue();
  registerAppServiceWorker();
  if(!restoredEarly){
    const restoredLate=await restoreSession();
    if(!restoredLate)openInitialScreenFromUrl();
  }
  await loadLookupCatalog();
  await loadAvailableSurveys();
  await ensureCollectorSurveyReady({advance:false,silent:true});
  await fetchSystemInfo();
  if(currentUser&&!currentUser.isGuest){
    document.getElementById('welcome-page')?.classList.add('hidden');
    document.getElementById('auth-page')?.classList.remove('visible');
    document.getElementById('app')?.classList.add('visible');
    applyRolePermissions();
    feather.replace();
  }
}
CollectorApp.boot=bootCollectorApp;
document.addEventListener('DOMContentLoaded',bootCollectorApp);
function enforceProvisionedAccessUI(){document.getElementById('create-account-btn')?.remove();document.getElementById('signup-tab')?.remove();document.getElementById('signup-form')?.remove();const switchToSignup=document.getElementById('switch-to-signup');if(switchToSignup){const holder=switchToSignup.parentElement;if(holder)holder.textContent='Accounts are created by an administrator.'}const authTitle=document.getElementById('auth-title');if(authTitle&&authTitle.textContent.trim()==='Create Account')authTitle.textContent='Sign In'}
function clearReferenceCaches(){localStorage.removeItem(LOOKUP_CACHE_KEY);localStorage.removeItem(SURVEY_CACHE_KEY)}
function openInitialScreenFromUrl(){
  const params=new URLSearchParams(window.location.search);
  const route=(params.get('screen')||window.location.hash.replace('#','')||'').trim().toLowerCase();
  if(route==='login'||route==='signin'){
    window.showAuth?.('login');
    return 'login';
  }
  if(route==='signup'||route==='register'){
    window.showAuth?.('signup');
    return 'signup';
  }
  if(route==='guest'){
    window.startGuest?.();
    return 'guest';
  }
  return 'welcome';
}
function applyAppVersionMigrations(){const storedVersion=localStorage.getItem(APP_STATE_VERSION_KEY)||'';if(storedVersion!==APP_VERSION){clearReferenceCaches();localStorage.removeItem(SIDEBAR_SECTION_STATE_KEY);localStorage.removeItem(QUESTIONNAIRE_SECTION_STATE_KEY);localStorage.removeItem(LAST_SURVEY_NAME_KEY);localStorage.removeItem('crop_collector_primary_module');syncHistory=[];localStorage.removeItem(SYNC_HISTORY_KEY);localStorage.setItem(APP_STATE_VERSION_KEY,APP_VERSION)}}
function applyMapInteractionLock(locked=mapInteractionLocked){
  mapInteractionLocked=!!locked;
  const toggleButton=document.getElementById('toggle-map-lock');
  const statusNode=document.getElementById('settings-map-lock-status');
  if(map){
    const handlers=['dragging','touchZoom','doubleClickZoom','scrollWheelZoom','boxZoom','keyboard'];
    handlers.forEach(key=>{
      const handler=map[key];
      if(!handler)return;
      if(mapInteractionLocked)handler.disable?.();
      else handler.enable?.();
    });
  }
  if(toggleButton){
    toggleButton.classList.toggle('active',mapInteractionLocked);
    toggleButton.classList.toggle('secondary',!mapInteractionLocked);
    toggleButton.innerHTML=mapInteractionLocked?'<i data-feather="unlock"></i> Unlock Map Movement':'<i data-feather="lock"></i> Lock Map Movement';
  }
  if(statusNode)statusNode.textContent=mapInteractionLocked?'Locked':'Unlocked';
  feather.replace();
  return mapInteractionLocked;
}
function toggleMapInteractionLock(){
  if(!map){
    showCollectorFeedback('The map is still loading. Try the map control again in a moment.','warning',{sticky:true});
    return false;
  }
  const nextState=!mapInteractionLocked;
  applyMapInteractionLock(nextState);
  showCollectorFeedback(nextState?'Map movement locked. The map will stay steady while you fill the form.':'Map movement unlocked. You can pan and zoom the map again.','info');
  return nextState;
}
function updateOrientationControls(message=''){
  const phoneLayout=document.getElementById('settings-phone-layout-status');
  const rotation=document.getElementById('settings-orientation-lock-status');
  const toolLayout=document.getElementById('settings-tool-layout-status');
  const guidance=document.getElementById('settings-guidance');
  if(phoneLayout)phoneLayout.textContent=portraitLockPreferred?'Portrait preferred':'Browser default';
  if(rotation)rotation.textContent=portraitLockPreferred?'Portrait requested':'Browser default';
  if(toolLayout)toolLayout.textContent='Settings separated from collection';
  if(guidance&&message)guidance.textContent=message;
}
async function applyPortraitPreference(){
  updateOrientationControls();
  return portraitLockPreferred;
}
async function togglePortraitLockPreference(){
  portraitLockPreferred=!portraitLockPreferred;
  localStorage.setItem(PORTRAIT_LOCK_KEY,portraitLockPreferred?'true':'false');
  updateOrientationControls(portraitLockPreferred?'Portrait layout preference saved.':'Browser-default rotation restored.');
  showCollectorFeedback(portraitLockPreferred?'Portrait layout preference saved.':'Browser-default rotation restored.','success');
  return portraitLockPreferred;
}
async function refreshReferenceData(){const preferredSurvey=document.getElementById('survey-name')?.value||localStorage.getItem(LAST_SURVEY_NAME_KEY)||'';const button=document.getElementById('refresh-reference-data');if(button){button.disabled=true;button.innerHTML='<i data-feather="loader"></i> Refreshing...';feather.replace()}try{clearReferenceCaches();setLastSyncMessage('Refreshing reference data from the server...','info');await loadLookupCatalog();await loadAvailableSurveys(preferredSurvey);if(typeof window.refreshGeographyCatalog==='function')await window.refreshGeographyCatalog();await fetchSystemInfo();updateOfflineStatus('Reference data refreshed. Province, district, ward, AEZ, survey, and lookup lists are ready for this session.');setLastSyncMessage('Reference data refreshed successfully.','success')}catch(error){updateOfflineStatus('Reference data refresh hit a problem. Existing cached values are still available.');setLastSyncMessage(`Reference data refresh failed: ${error.message||'Unknown error'}`,'error')}finally{if(button){button.disabled=false;button.innerHTML='<i data-feather="refresh-cw"></i> Refresh Reference Data';feather.replace()}}}
function registerAppServiceWorker(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register(`./service-worker.js?v=${encodeURIComponent(APP_VERSION)}`).then(registration=>{registration.update();if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)worker.postMessage({type:'SKIP_WAITING'})})})}).catch(()=>{})}
function reportCollectorRuntimeIssue(error){const rawMessage=(error&&typeof error==='object'&&'message'in error?error.message:error)||'Unknown runtime error';const message=String(rawMessage||'Unknown runtime error').trim()||'Unknown runtime error';window.__collectorLastRuntimeError=message;console.error('Crop Collector runtime issue:',error);try{const appState=window.CropCollectorApp?.state;const chosenModule=appState?.get?.('activeCollectorPrimaryModule')||activeCollectorPrimaryModule||null;const surveyField=document.getElementById('survey-name');const hasSurvey=!!String(surveyField?.value||'').trim();if(chosenModule&&hasSurvey&&typeof window.setCollectorWizardStep==='function'){window.setCollectorWizardStep(Math.max(1,Number(appState?.get?.('currentCollectorWizardStep')||currentCollectorWizardStep||0)));}if(typeof showCollectorFeedback==='function'){showCollectorFeedback(`Runtime issue caught: ${message}`,'error',{sticky:true,revealCollect:false});}}catch{}}
function registerCollectorRuntimeGuards(){if(window.__collectorRuntimeGuardsInstalled)return;window.__collectorRuntimeGuardsInstalled=true;window.addEventListener('error',event=>reportCollectorRuntimeIssue(event?.error||event?.message||event));window.addEventListener('unhandledrejection',event=>reportCollectorRuntimeIssue(event?.reason||event));}
function readLookupOptionsFromDom(selectId){const select=document.getElementById(selectId);if(!select)return[];const items=[];let sortOrder=10;[...select.children].forEach(node=>{if(node.tagName==='OPTGROUP'){const groupName=node.label||null;[...node.children].forEach(option=>{if(!option.value)return;items.push({category:'',code:option.value,label:option.textContent.trim(),group_name:groupName,sort_order:sortOrder,is_active:true});sortOrder+=10})}else if(node.tagName==='OPTION'&&node.value){items.push({category:'',code:node.value,label:node.textContent.trim(),group_name:null,sort_order:sortOrder,is_active:true});sortOrder+=10}});return items}
function buildFallbackLookupCatalog(){return{province:readLookupOptionsFromDom('province'),aez:readLookupOptionsFromDom('aez'),sector:readLookupOptionsFromDom('sector'),crop_type:readLookupOptionsFromDom('crop-type'),growth_stage:readLookupOptionsFromDom('growth-stage'),crop_condition:readLookupOptionsFromDom('crop-condition'),season:readLookupOptionsFromDom('season'),irrigation_type:readLookupOptionsFromDom('irrigation-type'),gender:readLookupOptionsFromDom('gender-hhh'),decision_maker_gender:readLookupOptionsFromDom('gender-decision-maker'),marital_status:readLookupOptionsFromDom('marital-status-hhh'),education_level:readLookupOptionsFromDom('education-level-hhh'),disability_condition:readLookupOptionsFromDom('disability-condition'),yes_no:[...readLookupOptionsFromDom('has-disability'),...readLookupOptionsFromDom('confirm-total-area-planted'),...readLookupOptionsFromDom('write-off'),...readLookupOptionsFromDom('gap-filling')].filter((item,index,array)=>array.findIndex(candidate=>candidate.code===item.code)===index),planting_dekad:readLookupOptionsFromDom('first-successful-planting-dekad'),planting_window:readLookupOptionsFromDom('planting-window'),seed_type:readLookupOptionsFromDom('seed-type'),major_variety:readLookupOptionsFromDom('major-variety'),write_off_cause:readLookupOptionsFromDom('write-off-cause'),major_input_source:readLookupOptionsFromDom('major-input-source'),prod:[],var:[]}}
function normalizeLookupCatalog(catalog){const fallback=buildFallbackLookupCatalog(),normalized={};Object.entries({...fallback,...(catalog||{})}).forEach(([category,items])=>{const sourceItems=Array.isArray(items)&&items.length?items:(fallback[category]||[]);normalized[category]=sourceItems.filter(Boolean).map((item,index)=>({category,code:String(item.code||'').trim(),label:String(item.label||item.code||'').trim(),group_name:item.group_name?String(item.group_name):null,sort_order:Number(item.sort_order??((index+1)*10)),is_active:item.is_active!==false})).filter(item=>item.code&&item.label)});return normalized}
function cacheLookupCatalog(catalog){localStorage.setItem(LOOKUP_CACHE_KEY,JSON.stringify(catalog))}
function getCachedLookupCatalog(){try{return JSON.parse(localStorage.getItem(LOOKUP_CACHE_KEY)||'{}')}catch{return{}}}
function rebuildLookupMaps(){Object.keys(lookupLabelMaps).forEach(key=>delete lookupLabelMaps[key]);Object.keys(cropLabels).forEach(key=>delete cropLabels[key]);Object.entries(lookupCatalog).forEach(([category,items])=>{lookupLabelMaps[category]={};items.forEach(item=>{lookupLabelMaps[category][item.code]=item.label;if(category==='crop_type')cropLabels[item.code]=item.label})})}
function findLookupValue(category,candidate){const token=String(candidate||'').trim().toLowerCase();if(!token)return null;return(lookupCatalog[category]||[]).find(item=>item.code.toLowerCase()===token||item.label.toLowerCase()===token)||null}
function getLookupLabel(category,code,fallback=''){const match=findLookupValue(category,code);return match?.label||fallback||String(code||'')}
function getLookupCode(category,value,fallback=''){const match=findLookupValue(category,value);return match?.code||fallback||String(value||'')}
function populateLookupSelect(selectId,category,placeholder,required=false){const select=document.getElementById(selectId);if(!select)return;const currentValue=getLookupCode(category,select.value);const options=(lookupCatalog[category]||[]).filter(item=>item.is_active!==false);select.innerHTML='';const placeholderOption=document.createElement('option');placeholderOption.value='';placeholderOption.textContent=placeholder;placeholderOption.disabled=!!required;placeholderOption.selected=!currentValue;select.appendChild(placeholderOption);const grouped=new Map();options.forEach(item=>{const key=item.group_name||'__ungrouped__';if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(item)});grouped.forEach((items,key)=>{const parent=key==='__ungrouped__'?select:document.createElement('optgroup');if(key!=='__ungrouped__')parent.label=key;items.forEach(item=>{const option=document.createElement('option');option.value=item.code;option.textContent=item.label;parent.appendChild(option)});if(parent!==select)select.appendChild(parent)});select.value=currentValue&&[...select.options].some(option=>option.value===currentValue)?currentValue:''}
function setLookupCatalog(catalog){lookupCatalog=normalizeLookupCatalog(catalog);rebuildLookupMaps();populateLookupSelect('province','province','Select province',true);populateLookupSelect('aez','aez','Select AEZ',true);populateLookupSelect('sector','sector','Select sector',true);populateLookupSelect('crop-type','crop_type','Select crop type',true);populateLookupSelect('growth-stage','growth_stage','Select growth stage',true);populateLookupSelect('crop-condition','crop_condition','Select crop condition');populateLookupSelect('season','season','Select season');populateLookupSelect('irrigation-type','irrigation_type','Select irrigation type');populateLookupSelect('gender-hhh','gender','Select gender',true);populateLookupSelect('gender-decision-maker','decision_maker_gender','Select decision maker gender',true);populateLookupSelect('marital-status-hhh','marital_status','Select marital status',true);populateLookupSelect('education-level-hhh','education_level','Select education level',true);populateLookupSelect('has-disability','yes_no','Select an option',true);populateLookupSelect('disability-condition','disability_condition','Select disability condition');populateLookupSelect('first-successful-planting-dekad','planting_dekad','Select planting dekad',true);populateLookupSelect('planting-window','planting_window','Select planting window',true);populateLookupSelect('confirm-total-area-planted','yes_no','Select an option',true);populateLookupSelect('seed-type','seed_type','Select seed type',true);populateLookupSelect('major-variety','major_variety','Select major variety',true);populateLookupSelect('write-off','yes_no','Select an option',true);populateLookupSelect('write-off-cause','write_off_cause','Select write off cause');populateLookupSelect('gap-filling','yes_no','Select an option',true);populateLookupSelect('major-input-source','major_input_source','Select input source',true);feather.replace()}
async function loadLookupCatalog(){const fallbackCatalog=buildFallbackLookupCatalog();let catalog={};try{const response=await fetch(`${API_URL}/lookups/public`);const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not load lookups');catalog=data||{};cacheLookupCatalog(catalog)}catch{catalog=getCachedLookupCatalog()||{}}const mergedCatalog=normalizeLookupCatalog({...fallbackCatalog,...catalog});cacheLookupCatalog(mergedCatalog);setLookupCatalog(mergedCatalog)}
function initCropLabels(){setLookupCatalog(buildFallbackLookupCatalog())}
function ensureSurveyNameSelect(){
  const field=document.getElementById('survey-name');
  if(!field||field.tagName==='SELECT')return field;
  const group=field.closest('.input-group');
  if(!group)return field;
  const select=document.createElement('select');
  select.id='survey-name';
  select.required=true;
  select.setAttribute('aria-label','Survey Name');
  select.innerHTML='<option value="" selected disabled>Select survey name</option>';
  if(field.className)select.className=field.className;
  group.replaceChild(select,field);
  return select;
}
function injectAdministrativeFields(){const form=document.getElementById('crop-form'),locationInput=document.getElementById('location-name'),locationGroup=document.getElementById('location-group')||locationInput?.closest('.input-group');if(locationInput)locationInput.type='hidden';if(locationGroup){locationGroup.style.display='none';locationGroup.hidden=true;locationGroup.setAttribute('aria-hidden','true');locationGroup.querySelector('label')?.remove()}if(!form||document.getElementById('questionnaire-id'))return;const block=document.createElement('div');block.id='ministry-admin-fields';block.innerHTML=`<div class="input-group"><input type="text" id="questionnaire-id" placeholder=" " required><label for="questionnaire-id">Questionnaire ID</label></div><div class="input-group"><select id="province" required><option value="" selected></option><option value="Bulawayo">Bulawayo</option><option value="Harare">Harare</option><option value="Manicaland">Manicaland</option><option value="Mashonaland Central">Mashonaland Central</option><option value="Mashonaland East">Mashonaland East</option><option value="Mashonaland West">Mashonaland West</option><option value="Masvingo">Masvingo</option><option value="Matabeleland North">Matabeleland North</option><option value="Matabeleland South">Matabeleland South</option><option value="Midlands">Midlands</option></select><label for="province">Province</label></div><div class="input-group"><input type="text" id="district" placeholder=" " required><label for="district">District</label></div><div class="input-group"><input type="text" id="ward" placeholder=" " required><label for="ward">Ward Number</label></div><div class="input-group"><select id="aez" required><option value="" selected></option><option value="I">AEZ I</option><option value="IIa">AEZ IIa</option><option value="IIb">AEZ IIb</option><option value="III">AEZ III</option><option value="IV">AEZ IV</option><option value="V">AEZ V</option></select><label for="aez">AEZ</label></div><div class="input-group"><input type="text" id="aeo-name" placeholder=" " required><label for="aeo-name">Name of AEO</label></div><div class="input-group"><input type="text" id="aeo-contact-number" placeholder=" "><label for="aeo-contact-number">AEO Contact Number</label></div><div class="input-group"><input type="text" id="farmer-contact" placeholder=" "><label for="farmer-contact">Farmer or Manager Contact</label></div>`;const surveyGroup=document.getElementById('survey-name')?.closest('.input-group');if(surveyGroup)surveyGroup.insertAdjacentElement('afterend',block);else form.insertBefore(block,form.firstChild)}
function injectMinistrySummaryFields(){const form=document.getElementById('crop-form');if(!form||document.getElementById('ministry-summary-fields'))return;const block=document.createElement('div');block.id='ministry-summary-fields';block.innerHTML=`<div class="status" style="margin-bottom:.75rem;background:#eef6ef;color:#1b5e20">Household and land summary for the current farmer.</div><div class="input-group"><select id="gender-hhh" required><option value="" selected></option><option value="Male">Male</option><option value="Female">Female</option></select><label for="gender-hhh">Gender of HHH</label></div><div class="input-group"><select id="gender-decision-maker" required><option value="" selected></option><option value="Male">Male</option><option value="Female">Female</option><option value="Both">Both</option></select><label for="gender-decision-maker">Gender of Decision Maker</label></div><div class="input-group"><input type="number" id="age-hhh" min="0" step="1" placeholder=" " required><label for="age-hhh">Age of HHH</label></div><div class="input-group"><select id="marital-status-hhh" required><option value="" selected></option><option value="Married">Married</option><option value="Single">Single</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option></select><label for="marital-status-hhh">Marital Status of HHH</label></div><div class="input-group"><select id="education-level-hhh" required><option value="" selected></option><option value="No School">No School</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option><option value="Tertiary">Tertiary</option><option value="College">College</option><option value="University">University</option><option value="Other">Other</option></select><label for="education-level-hhh">Level of Education of HHH</label></div><div class="input-group"><select id="has-disability" required><option value="" selected></option><option value="Yes">Yes</option><option value="No">No</option></select><label for="has-disability">Does HH Have Any Disability?</label></div><div class="input-group"><select id="disability-condition"><option value="" selected></option><option value="Physical">Physical</option><option value="Visual">Visual</option><option value="Hearing">Hearing</option><option value="Speech">Speech</option><option value="Intellectual">Intellectual</option><option value="Psychosocial">Psychosocial</option><option value="Multiple">Multiple</option><option value="Other">Other</option></select><label for="disability-condition">Disability Condition</label></div><div class="input-group"><input type="number" id="hh-size-0-17" min="0" step="1" placeholder=" " required><label for="hh-size-0-17">HH Size 0-17</label></div><div class="input-group"><input type="number" id="hh-size-18-35" min="0" step="1" placeholder=" " required><label for="hh-size-18-35">HH Size 18-35</label></div><div class="input-group"><input type="number" id="hh-size-36-60" min="0" step="1" placeholder=" " required><label for="hh-size-36-60">HH Size 36-60</label></div><div class="input-group"><input type="number" id="hh-size-60-plus" min="0" step="1" placeholder=" " required><label for="hh-size-60-plus">HH Size 60+</label></div><div class="input-group"><input type="number" id="total-owned-land-holding-ha" min="0" step="0.01" placeholder=" " required><label for="total-owned-land-holding-ha">Total Owned Land Holding (ha)</label></div><div class="input-group"><input type="number" id="owned-arable-land-ha" min="0" step="0.01" placeholder=" " required><label for="owned-arable-land-ha">Owned Arable Land (ha)</label></div><div class="input-group"><input type="number" id="land-rented-from-others-ha" min="0" step="0.01" placeholder=" " required><label for="land-rented-from-others-ha">Land Rented From Others (ha)</label></div><div class="input-group"><input type="number" id="land-rented-to-others-ha" min="0" step="0.01" placeholder=" " required><label for="land-rented-to-others-ha">Land Rented To Others (ha)</label></div><div class="input-group"><input type="number" id="total-area-planted-all-crops-ha" min="0" step="0.01" placeholder=" " required><label for="total-area-planted-all-crops-ha">Total Area Planted All Crops (ha)</label></div><div class="input-group"><input type="number" id="cropped-area-with-contours-ha" min="0" step="0.01" placeholder=" " required><label for="cropped-area-with-contours-ha">Cropped Area With Contours (ha)</label></div>`;const adminBlock=document.getElementById('ministry-admin-fields');if(adminBlock)adminBlock.insertAdjacentElement('afterend',block);else form.insertBefore(block,form.firstChild)}
function injectPlotAgronomyFields(){const form=document.getElementById('crop-form');if(!form||document.getElementById('ministry-plot-fields'))return;const block=document.createElement('div');block.id='ministry-plot-fields';block.innerHTML=`<div class="status" style="margin-bottom:.75rem;background:#eef6ef;color:#1b5e20">Plot agronomy details for the current crop block.</div><div class="input-group"><select id="first-successful-planting-dekad" required><option value="" selected></option><option value="1st Dekad">1st Dekad</option><option value="2nd Dekad">2nd Dekad</option><option value="3rd Dekad">3rd Dekad</option></select><label for="first-successful-planting-dekad">First Successful Planting Dekad</label></div><div class="input-group"><select id="planting-window" required><option value="" selected></option><option value="End of Nov 2024">End of Nov 2024</option><option value="Dec 2024">Dec 2024</option><option value="Jan 2025">Jan 2025</option></select><label for="planting-window">Planting Window</label></div><div class="input-group"><input type="number" id="seed-kg" min="0" step="0.01" placeholder=" " required><label for="seed-kg">Seed (kg)</label></div><div class="input-group"><input type="number" id="basal-dressing-kg" min="0" step="0.01" placeholder=" " required><label for="basal-dressing-kg">Basal Dressing (kg)</label></div><div class="input-group"><input type="number" id="top-dressing-kg" min="0" step="0.01" placeholder=" " required><label for="top-dressing-kg">Top Dressing (kg)</label></div><div class="input-group"><input type="number" id="lime-kg" min="0" step="0.01" placeholder=" " required><label for="lime-kg">Lime (kg)</label></div><div class="input-group"><select id="confirm-total-area-planted" required><option value="" selected></option><option value="Yes">Yes</option><option value="No">No</option></select><label for="confirm-total-area-planted">Confirm Total Area Planted</label></div><div class="input-group"><select id="seed-type" required><option value="" selected></option><option value="Hybrid">Hybrid</option><option value="O.P.V">O.P.V</option><option value="N/A">N/A</option></select><label for="seed-type">Seed Type</label></div><div class="input-group"><select id="major-variety" required><option value="" selected></option><optgroup label="Maize"><option value="Ultra-Short season">Ultra-Short season</option><option value="Short season">Short season</option><option value="Medium season">Medium season</option><option value="Long season">Long season</option><option value="OPV">OPV</option></optgroup><optgroup label="Sorghum"><option value="Macia">Macia</option><option value="Sila">Sila</option><option value="SV-2">SV-2</option></optgroup><optgroup label="Millet"><option value="PMV-1">PMV-1</option><option value="PMV-2">PMV-2</option><option value="Local">Local</option></optgroup><optgroup label="Groundnuts"><option value="CG7">CG7</option><option value="Falcon">Falcon</option><option value="Natal Common">Natal Common</option></optgroup><optgroup label="Soybeans"><option value="SC Safari">SC Safari</option><option value="Serenade">Serenade</option></optgroup><optgroup label="Sunflower"><option value="Hybrid">Hybrid</option></optgroup><optgroup label="Common"><option value="Other">Other</option><option value="N/A">N/A</option></optgroup></select><label for="major-variety">Major Variety</label></div><div class="input-group"><select id="write-off" required><option value="" selected></option><option value="Yes">Yes</option><option value="No">No</option></select><label for="write-off">Write Off</label></div><div class="input-group"><input type="number" id="write-off-area-ha" min="0" step="0.01" placeholder=" "><label for="write-off-area-ha">Write Off Area (ha)</label></div><div class="input-group"><select id="write-off-cause"><option value="" selected></option><option value="Drought">Drought</option><option value="Flooding">Flooding</option><option value="Disease">Disease</option><option value="Pests">Pests</option><option value="Poor Germination">Poor Germination</option><option value="Other">Other</option></select><label for="write-off-cause">Write Off Cause</label></div><div class="input-group"><input type="text" id="write-off-other-cause" placeholder=" "><label for="write-off-other-cause">Other Write Off Cause</label></div><div class="input-group"><select id="gap-filling" required><option value="" selected></option><option value="Yes">Yes</option><option value="No">No</option></select><label for="gap-filling">Gap Filling</label></div><div class="input-group"><input type="number" id="area-replanted-ha" min="0" step="0.01" placeholder=" "><label for="area-replanted-ha">Area Replanted (ha)</label></div><div class="input-group"><select id="major-input-source" required><option value="" selected></option><option value="Presidential">Presidential</option><option value="AFC">AFC</option><option value="CBZ Agroyield">CBZ Agroyield</option><option value="NGO">NGO</option><option value="Self Finance">Self Finance</option><option value="Other">Other</option><option value="N/A">N/A</option></select><label for="major-input-source">Major Input Source</label></div>`;const summaryBlock=document.getElementById('ministry-summary-fields');if(summaryBlock)summaryBlock.insertAdjacentElement('afterend',block);else form.insertBefore(block,form.firstChild)}
function injectFieldEnhancements(){const gpsTools=document.getElementById('gps-location-btn')?.closest('.button-group'),locationGroup=document.getElementById('location-group'),locationInput=document.getElementById('location-name'),notesGroup=document.getElementById('notes')?.closest('.input-group'),surveyInput=document.getElementById('survey-name');if(gpsTools)gpsTools.remove();if(locationInput)locationInput.type='hidden';if(locationGroup)locationGroup.style.display='none';if(surveyInput&&surveyInput.tagName!=='SELECT'){const surveySelect=document.createElement('select');surveySelect.id='survey-name';surveySelect.required=true;surveySelect.innerHTML='<option value="" selected></option>';for(const attr of [...surveyInput.attributes]){if(['type','placeholder','list','autocomplete','value'].includes(attr.name))continue;if(attr.name==='id')continue;surveySelect.setAttribute(attr.name,attr.value)}surveyInput.replaceWith(surveySelect)}const surveyField=document.getElementById('survey-name');if(surveyField){surveyField.removeAttribute('list');surveyField.setAttribute('autocomplete','off');if(!document.getElementById('survey-field-note'))surveyField.parentElement?.insertAdjacentHTML('beforeend','<div id="survey-field-note" style="margin-top:.35rem;font-size:.76rem;color:#5f6f5f">Active surveys are managed in the admin dashboard.</div>')}if(notesGroup&&!document.getElementById('photo-file')){const photoBlock=document.createElement('div');photoBlock.innerHTML=`<input type="file" id="photo-file" accept="image/*" capture="environment" style="display:none"><input type="hidden" id="photo-name"><input type="hidden" id="photo-data"><div class="button-group" style="margin-top:-.2rem;margin-bottom:.75rem"><button type="button" id="photo-pick-btn" class="secondary"><i data-feather="camera"></i> Add Field Photo</button><button type="button" id="clear-photo-btn" class="warning" style="display:none"><i data-feather="trash-2"></i> Clear Photo</button></div><div id="photo-preview-panel" class="status" style="display:none"><strong id="photo-preview-name" style="display:block;margin-bottom:.45rem"></strong><img id="photo-preview-image" alt="Field photo preview" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px"></div>`;notesGroup.insertAdjacentElement('beforebegin',photoBlock)}}
function isSurveyActiveFlag(value){return !(value===false||value===0||String(value).toLowerCase()==='false'||String(value).toLowerCase()==='inactive')}
function normalizeSurveyType(value){const token=String(value||'crop').trim().toLowerCase();return token==='livestock'?'livestock':token==='mixed'?'mixed':'crop'}
function getFallbackSurveyCatalog(){return normalizeSurveyCatalog([{name:'2026 Crop Field Survey',survey_type:'crop',is_active:true,enabled_modules:['crop']},{name:'00 Demo Crop Survey',survey_type:'crop',is_active:true,enabled_modules:['crop']},{name:'00 Demo Livestock Survey',survey_type:'livestock',is_active:true,enabled_modules:['livestock']},{name:'Winter Agriculture Survey',survey_type:'mixed',is_active:true,enabled_modules:['crop','livestock']}])}
function normalizeSurveyCatalog(items=[]){return(Array.isArray(items)?items:[]).map(item=>({name:String(item?.name||'').trim(),description:item?.description||null,is_active:isSurveyActiveFlag(item?.is_active),survey_type:normalizeSurveyType(item?.survey_type),enabled_modules:Array.isArray(item?.enabled_modules)?item.enabled_modules.filter(Boolean):[],enabled_question_steps:Array.isArray(item?.enabled_question_steps)?item.enabled_question_steps.filter(Boolean):[]})).filter(item=>item.name)}
function getCachedSurveyCatalog(){try{return normalizeSurveyCatalog(JSON.parse(localStorage.getItem(SURVEY_CACHE_KEY)||'[]'))}catch{return[]}}
function cacheSurveyCatalog(items){localStorage.setItem(SURVEY_CACHE_KEY,JSON.stringify(normalizeSurveyCatalog(items).slice(0,200)))}
function normalizeSurveyName(value){return String(value||'').trim().toLowerCase()}
function rebuildSurveyConfigMap(items=[]){availableSurveyConfigs={};normalizeSurveyCatalog(items).forEach(item=>{availableSurveyConfigs[item.name]=item});window.CropCollectorApp?.state?.set?.('availableSurveyConfigs',availableSurveyConfigs);return availableSurveyConfigs}
function getSelectedSurveyConfig(){const surveyName=String(document.getElementById('survey-name')?.value||'').trim();if(!surveyName)return null;return availableSurveyConfigs[surveyName]||null}
function renderSurveyNameOptions(preferred=''){const select=document.getElementById('survey-name');if(!select)return;const preferredName=(preferred||'').replace(/\s+\(inactive\)$/i,'').trim();const DEMO_SURVEY_NAME='00 Demo Crop Survey';const activeNames=[...new Set(availableSurveys.filter(Boolean))].sort((a,b)=>{if(a===DEMO_SURVEY_NAME&&b!==DEMO_SURVEY_NAME)return-1;if(b===DEMO_SURVEY_NAME&&a!==DEMO_SURVEY_NAME)return 1;return a.localeCompare(b)});const hasPreferred=!!preferredName&&activeNames.some(name=>normalizeSurveyName(name)===normalizeSurveyName(preferredName));const preferredOption=!hasPreferred&&preferredName?preferredName:'';select.innerHTML=`<option value="" ${preferredName?'':'selected'} disabled>${activeNames.length?'Select survey name':'No active surveys available'}</option>`;activeNames.forEach(name=>{const option=document.createElement('option');const config=availableSurveyConfigs[name]||{};option.value=name;option.textContent=name;option.dataset.surveyType=config.survey_type||'';select.appendChild(option)});if(preferredOption){const option=document.createElement('option');option.value=preferredOption;option.textContent=preferredOption;option.dataset.surveyType=availableSurveyConfigs[preferredOption]?.survey_type||'';select.appendChild(option)}const demoAvailable=activeNames.includes(DEMO_SURVEY_NAME);const chosen=preferredName||(demoAvailable?DEMO_SURVEY_NAME:(activeNames.length===1?activeNames[0]:''));select.value=chosen&&[...select.options].some(option=>option.value===chosen)?chosen:'';if(select.value)localStorage.setItem(LAST_SURVEY_NAME_KEY,select.value);else localStorage.removeItem(LAST_SURVEY_NAME_KEY);select.disabled=!activeNames.length&&!preferredOption;window.syncCollectorSurveyMenu?.();if(select.value&&window.CropCollectorApp?.state?.get?.('activeCollectorPrimaryModule')){try{window.resetCollectorWizardForSurvey?.(window.CropCollectorApp.state.get('activeCollectorPrimaryModule'))}catch{if(typeof window.setCollectorWizardStep==='function')window.setCollectorWizardStep(0)}}}
function isKnownSurveyName(name){const normalized=normalizeSurveyName(name),select=document.getElementById('survey-name');if(!normalized||!select)return false;return[...select.options].some(option=>normalizeSurveyName(option.value)===normalized)}
async function loadAvailableSurveys(preferred=''){const input=document.getElementById('survey-name');if(!input)return;let surveyCatalog=[];try{const response=await fetch(`${API_URL}/surveys/public`,{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not load surveys');surveyCatalog=normalizeSurveyCatalog(data);cacheSurveyCatalog(surveyCatalog)}catch{surveyCatalog=getCachedSurveyCatalog()}if(!surveyCatalog.length)surveyCatalog=getFallbackSurveyCatalog();availableSurveys=surveyCatalog.filter(item=>item.is_active!==false).map(item=>item.name).filter(Boolean);rebuildSurveyConfigMap(surveyCatalog);renderSurveyNameOptions(preferred||input.value||localStorage.getItem(LAST_SURVEY_NAME_KEY)||'')}
async function ensureCollectorSurveyReady({advance=false,silent=false,requestedModule=null}={}){const surveyField=document.getElementById('survey-name');if(!surveyField)return false;console.log('[CollectorDebug] ensureCollectorSurveyReady:start',{advance,silent,requestedModule,currentValue:surveyField.value||'',availableSurveys:[...availableSurveys],lastSurvey:localStorage.getItem(LAST_SURVEY_NAME_KEY)||'',activeModule:activeCollectorPrimaryModule||null});const applyChoice=()=>{const fallback=surveyField.value||availableSurveys[0]||'';if(fallback&&[...surveyField.options].some(option=>option.value===fallback)){surveyField.value=fallback;rememberSurveyName(fallback);return true}return !!String(surveyField.value||'').trim()};let hasSurvey=applyChoice();if(!hasSurvey){console.log('[CollectorDebug] ensureCollectorSurveyReady:loading-surveys');await loadAvailableSurveys(localStorage.getItem(LAST_SURVEY_NAME_KEY)||'');hasSurvey=applyChoice()}const selectedSurvey=getSelectedSurveyConfig();const effectiveModule=requestedModule||activeCollectorPrimaryModule||null;const debugData={hasSurvey,selectedSurveyName:selectedSurvey?.name||null,selectedSurveyType:selectedSurvey?.survey_type||null,effectiveModule,fieldValue:surveyField.value||''};console.log('[CollectorDebug] ensureCollectorSurveyReady:resolved',JSON.stringify(debugData));if(selectedSurvey&&selectedSurvey.survey_type&&selectedSurvey.survey_type!=='mixed'&&effectiveModule&&selectedSurvey.survey_type!==effectiveModule){console.warn('[CollectorDebug] ensureCollectorSurveyReady:module-mismatch',{selectedSurveyType:selectedSurvey.survey_type,effectiveModule});if(!silent&&typeof showCollectorFeedback==='function')showCollectorFeedback(`"${selectedSurvey.name}" is a ${selectedSurvey.survey_type} survey. Choose the ${selectedSurvey.survey_type} path to continue.`,'warning',{sticky:true});window.refreshCollectorSurveyTypeMatch?.();return false}if(hasSurvey&&window.CropCollectorApp?.state?.get?.('activeCollectorPrimaryModule')){try{window.resetCollectorWizardForSurvey?.(window.CropCollectorApp.state.get('activeCollectorPrimaryModule'))}catch{if(advance&&typeof window.setCollectorWizardStep==='function')window.setCollectorWizardStep(0)}}if(!hasSurvey&&!silent&&typeof showCollectorFeedback==='function'){console.warn('[CollectorDebug] ensureCollectorSurveyReady:no-survey-available');showCollectorFeedback('No active survey could be loaded yet. Refresh reference data or create one in admin.','warning',{sticky:true})}return hasSurvey}
function injectValidationEnhancements(){const form=document.getElementById('validate-form-el');if(!form||document.getElementById('validation-geometry-tools'))return;const block=document.createElement('div');block.id='validation-geometry-tools';block.innerHTML=`<div class="button-group" style="margin-bottom:.75rem"><button type="button" id="validate-pick-polygon"><i data-feather="hexagon"></i> Select Polygon</button><button type="button" id="validate-pick-point" class="secondary"><i data-feather="map-pin"></i> Select Point</button></div><div class="status" id="validation-selection-status" style="display:none;margin-bottom:.75rem"></div><div class="status" id="validation-filter-status" style="margin-bottom:.75rem">Validation filter: All features.</div><div class="button-group" style="margin-bottom:.9rem"><button type="button" id="validate-filter-all">All Features</button><button type="button" id="validate-filter-polygon" class="secondary">Polygons Only</button><button type="button" id="validate-filter-point" class="secondary">Points Only</button></div><div class="button-group" style="margin-bottom:.9rem"><button type="button" id="validate-previous-feature" class="secondary"><i data-feather="skip-back"></i> Previous Feature</button><button type="button" id="validate-next-feature" class="secondary"><i data-feather="skip-forward"></i> Next Feature</button></div>`;form.insertBefore(block,form.firstChild);updateValidationGeometryButtons()}
function getActiveMode(){return document.getElementById('mode-validate')?.classList.contains('active')?'validate':'collect'}
function getValidationGeometryLabel(){return validationGeometryFilter==='point'?'Points':validationGeometryFilter==='polygon'?'Polygons':'All features'}
function getValidationPrompt(){return validationGeometryFilter==='point'?'Select a synced point to validate.':validationGeometryFilter==='polygon'?'Select a synced polygon to validate.':'Select a synced field entry to validate.'}
function matchesValidationGeometry(entry){const captureType=typeof entry==='string'?entry:(entry?.captureType||inferCaptureType(entry?.geometry));return validationGeometryFilter==='all'||captureType===validationGeometryFilter}
function updateValidationGeometryButtons(){const allBtn=document.getElementById('validate-filter-all'),polygonBtn=document.getElementById('validate-filter-polygon'),pointBtn=document.getElementById('validate-filter-point'),status=document.getElementById('validation-filter-status');if(allBtn){allBtn.className=validationGeometryFilter==='all'?'':'secondary'}if(polygonBtn){polygonBtn.className=validationGeometryFilter==='polygon'?'':'secondary'}if(pointBtn){pointBtn.className=validationGeometryFilter==='point'?'':'secondary'}if(status)status.textContent=`Validation filter: ${getValidationGeometryLabel()}.`;feather.replace()}
function setValidationGeometryFilter(filter){validationGeometryFilter=filter||'all';selectedEntryId=null;updateValidationGeometryButtons();updateValidationTarget();if(getActiveMode()==='validate')renderEntries()}
function getEntryReferenceLatLng(entry){if(!entry?.geometry||typeof L==='undefined')return null;try{if(entry.geometry.type==='Point'&&Array.isArray(entry.geometry.coordinates)){return L.latLng(entry.geometry.coordinates[1],entry.geometry.coordinates[0])}const preview=L.geoJSON({type:'Feature',geometry:entry.geometry});const bounds=preview.getBounds();return bounds.isValid()?bounds.getCenter():null}catch{return null}}
function getValidationCandidates(filter=validationGeometryFilter){return fieldEntries.filter(entry=>entry.source==='backend'&&(filter==='all'||matchesValidationGeometry(filter))&&matchesValidationGeometry(entry))}
function findNearestValidationEntry(filter){const matches=getValidationCandidates(filter);if(!matches.length)return null;const reference=currentLocationLatLng||(map?.getCenter?.()||null);if(!reference)return matches[0];let bestEntry=matches[0],bestDistance=Number.POSITIVE_INFINITY;matches.forEach(entry=>{const latlng=getEntryReferenceLatLng(entry);if(!latlng)return;const distance=reference.distanceTo(latlng);if(distance<bestDistance){bestDistance=distance;bestEntry=entry}});return bestEntry}
function findNextValidationEntry(currentId=selectedEntryId,filter=validationGeometryFilter){const matches=getValidationCandidates(filter);if(!matches.length)return null;if(currentId===null||currentId===undefined||currentId==='')return matches[0];const currentIndex=matches.findIndex(entry=>String(entry.id)===String(currentId)||String(entry.localId)===String(currentId));if(currentIndex===-1)return matches[0];return matches[(currentIndex+1)%matches.length]}
function findPreviousValidationEntry(currentId=selectedEntryId,filter=validationGeometryFilter){const matches=getValidationCandidates(filter);if(!matches.length)return null;if(currentId===null||currentId===undefined||currentId==='')return matches[matches.length-1];const currentIndex=matches.findIndex(entry=>String(entry.id)===String(currentId)||String(entry.localId)===String(currentId));if(currentIndex===-1)return matches[matches.length-1];return matches[(currentIndex-1+matches.length)%matches.length]}
function setValidationSelectionMessage(message='',tone='info'){const status=document.getElementById('validation-selection-status');if(!status)return;if(!message){status.style.display='none';status.textContent='';status.style.background='';status.style.color='';return}status.style.display='block';status.textContent=message;if(tone==='warning'){status.style.background='#fff3cd';status.style.color='#8a5a00'}else{status.style.background='#e8f5e9';status.style.color='#1b5e20'}}
function beginValidationSelection(filter){if(!hasRole('validator','admin')){setValidationSelectionMessage('Your role cannot access validation mode.','warning');showCollectorFeedback('Validation tools are available only to validators and admins.','warning',{sticky:true});return}const validateSection=document.getElementById('validate-form')?.closest('.section');setMode('validate');setValidationGeometryFilter(filter);toggleSidebar(true);collapseSidebarSectionsExcept(document.getElementById('collector-quick-menu'),validateSection);openSidebarSection(validateSection);setQuickMenuActive('validate');const candidate=findNearestValidationEntry(filter);if(candidate){focusEntry(candidate.id||candidate.localId);setValidationSelectionMessage(`Nearest ${filter} selected automatically.`, 'info')}else{setValidationSelectionMessage(`No synced ${filter}s are available for validation right now.`, 'warning')}const target=document.getElementById('validation-target');if(target)target.scrollIntoView({behavior:'smooth',block:'nearest'})}
function goToPreviousValidationFeature(){if(!hasRole('validator','admin')){setValidationSelectionMessage('Your role cannot access validation mode.','warning');showCollectorFeedback('Validation tools are available only to validators and admins.','warning',{sticky:true});return}if(getActiveMode()!=='validate')setMode('validate');const previousEntry=findPreviousValidationEntry();if(!previousEntry){setValidationSelectionMessage(`No synced ${validationGeometryFilter==='all'?'features':validationGeometryFilter+'s'} are available for validation right now.`, 'warning');return}focusEntry(previousEntry.id||previousEntry.localId);setValidationSelectionMessage(`Moved to previous ${previousEntry.captureType||inferCaptureType(previousEntry.geometry)||'feature'} for validation.`, 'info')}
function goToNextValidationFeature(){if(!hasRole('validator','admin')){setValidationSelectionMessage('Your role cannot access validation mode.','warning');showCollectorFeedback('Validation tools are available only to validators and admins.','warning',{sticky:true});return}if(getActiveMode()!=='validate')setMode('validate');const nextEntry=findNextValidationEntry();if(!nextEntry){setValidationSelectionMessage(`No synced ${validationGeometryFilter==='all'?'features':validationGeometryFilter+'s'} are available for validation right now.`, 'warning');return}focusEntry(nextEntry.id||nextEntry.localId);setValidationSelectionMessage(`Moved to next ${nextEntry.captureType||inferCaptureType(nextEntry.geometry)||'feature'} for validation.`, 'info')}
function syncModePanels(collect){const app=document.getElementById('app'),collectForm=document.getElementById('collect-form'),validateForm=document.getElementById('validate-form');if(app)app.dataset.mode=collect?'collect':'validate';if(collectForm){collectForm.style.display=collect?'block':'none';collectForm.hidden=!collect;collectForm.setAttribute('aria-hidden',String(!collect))}if(validateForm){validateForm.style.display=collect?'none':'block';validateForm.hidden=collect;validateForm.setAttribute('aria-hidden',String(collect))}}
function isMobileCollector(){return window.innerWidth<900||/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent||'')}
function clearCurrentLocationVisuals(){if(currentLocationMarker&&map?.hasLayer(currentLocationMarker))map.removeLayer(currentLocationMarker);if(currentLocationAccuracyCircle&&map?.hasLayer(currentLocationAccuracyCircle))map.removeLayer(currentLocationAccuracyCircle);currentLocationMarker=null;currentLocationAccuracyCircle=null}
function showCurrentLocationOnMap(lat,lng,accuracy=0,{center=false}={}){if(!map)return;const latlng=L.latLng(lat,lng);currentLocationLatLng=latlng;window.__collectorCurrentLocationAccuracyMeters=Number.isFinite(Number(accuracy))?Number(accuracy):null;clearCurrentLocationVisuals();currentLocationMarker=L.circleMarker(latlng,{radius:7,color:'#1565c0',weight:3,fillColor:'#42a5f5',fillOpacity:.95,interactive:false});currentLocationAccuracyCircle=L.circle(latlng,{radius:Math.max(Number(accuracy)||0,8),color:'#42a5f5',weight:1,fillColor:'#90caf9',fillOpacity:.18,interactive:false});currentLocationAccuracyCircle.addTo(map);currentLocationMarker.addTo(map);window.refreshFieldReadinessStatus?.().catch?.(()=>{});if(center&&!selectedPolygon&&!selectedEntryId){const zoom=Number.isFinite(map.getZoom())?Math.max(map.getZoom(),16):16;map.setView(latlng,zoom,{animate:true})}}
function syncLocationFieldFromCurrentPosition(){const input=document.getElementById('location-name');if(input&&currentLocationLatLng&&!selectedPolygon&&!editingEntryId&&!input.dataset.manualOverride){input.value=`Current location (${formatCoordinate(currentLocationLatLng.lat)}, ${formatCoordinate(currentLocationLatLng.lng)})`}}
function autoLocateCollector({forceCenter=false,silent=false}={}){if(!map||!navigator.geolocation||autoLocationRequested&&!forceCenter)return;if(!isMobileCollector()&&!forceCenter)return;autoLocationRequested=true;navigator.geolocation.getCurrentPosition(position=>{const {latitude,longitude,accuracy}=position.coords;showCurrentLocationOnMap(latitude,longitude,accuracy,{center:true});syncLocationFieldFromCurrentPosition();if(!silent){let accuracyMsg=`GPS ready. Current location captured with approximately ${Math.round(accuracy||0)}m accuracy.`;if(accuracy>15){accuracyMsg+=` (Low accuracy. Try moving to an open area with a clear sky view.)`;showCollectorFeedback(`GPS accuracy is low (${Math.round(accuracy)}m). If mapping a boundary, wait for a stronger signal or stand in an open area.`,'warning')}updateOfflineStatus(accuracyMsg)}},error=>{if(forceCenter&&!silent){updateOfflineStatus(`Could not get current location: ${error.message}`);showCollectorFeedback(`Could not get current location: ${error.message}`,'warning',{sticky:true})}else if(!silent)updateOfflineStatus('GPS not available yet. You can still draw manually on the map.')},{enableHighAccuracy:true,timeout:15000,maximumAge:30000})}
function generateCollectorDeviceId(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return`device-${window.crypto.randomUUID()}`;return`device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`}
function getCollectorDeviceId(){let deviceId='';try{deviceId=localStorage.getItem(DEVICE_ID_KEY)||'';if(!deviceId){deviceId=generateCollectorDeviceId();localStorage.setItem(DEVICE_ID_KEY,deviceId)}}catch{deviceId=deviceId||generateCollectorDeviceId()}return deviceId}
function injectDrawingActionButtons(){const form=document.getElementById('crop-form');if(!form||document.getElementById('geometry-edit-status'))return;const note=document.createElement('div');note.id='geometry-edit-status';note.className='status';note.style.marginTop='-.4rem';note.style.marginBottom='1rem';note.style.display='none';const saveBtn=document.getElementById('save-entry-btn');if(saveBtn&&!document.getElementById('save-flow-card')){const saveFlow=document.createElement('div');saveFlow.id='save-flow-card';saveFlow.className='save-flow-card';saveFlow.innerHTML='<strong id="save-flow-title">Draw or select a shape</strong><p id="save-flow-message">Use the map tools, then tap the shape once to confirm it before saving.</p><div id="save-flow-chip-row" class="save-flow-chip-row"></div>';saveBtn.insertAdjacentElement('beforebegin',saveFlow)}if(saveBtn&&!document.getElementById('save-action-stack')){const actionStack=document.createElement('div');actionStack.id='save-action-stack';actionStack.className='save-action-stack';saveBtn.insertAdjacentElement('beforebegin',actionStack);actionStack.appendChild(saveBtn)}const actionStack=document.getElementById('save-action-stack');if(saveBtn&&!document.getElementById('save-next-plot-btn')){const nextBtn=document.createElement('button');nextBtn.type='button';nextBtn.id='save-next-plot-btn';nextBtn.className='secondary';nextBtn.style.display='none';nextBtn.innerHTML='<i data-feather="plus-circle"></i> Submit & Add Another Plot';actionStack?.appendChild(nextBtn)}['remove-shape-btn','cancel-edit-btn','select-polygon-btn'].forEach(id=>{const button=document.getElementById(id);if(button&&actionStack&&!actionStack.contains(button))actionStack.appendChild(button)});form.insertBefore(note,document.getElementById('save-flow-card'));updateCollectorSubmitButtons(false);updateMobileSaveFlowState()}
function injectFarmerSummaryPanel(){const form=document.getElementById('crop-form');if(!form||document.getElementById('farmer-summary-panel'))return;const panel=document.createElement('div');panel.id='farmer-summary-panel';panel.className='status';panel.style.display='none';panel.style.marginBottom='1rem';panel.innerHTML='<strong id="farmer-summary-title" style="display:block"></strong><div class="status-grid" style="margin-top:.75rem"><div class="status-card"><strong id="farmer-summary-plots">0</strong><span>Plots</span></div><div class="status-card"><strong id="farmer-summary-area">0.00</strong><span>Total Ha</span></div><div class="status-card"><strong id="farmer-summary-next">1</strong><span>Next Plot</span></div></div><div id="farmer-summary-crops" style="margin-top:.75rem;font-size:.82rem;color:#49604c"></div><div id="farmer-summary-note" style="margin-top:.55rem;font-size:.8rem;color:#5f6f5f"></div><div id="farmer-summary-actions" style="margin-top:.75rem;display:none"><button type="button" id="farmer-summary-continue-btn" class="secondary" style="width:auto;padding:.55rem .85rem"><i data-feather="plus-circle"></i> Continue With Same Farmer</button></div>';form.insertBefore(panel,form.firstChild)}
function injectFarmerDetailPanel(){const list=document.getElementById('fields-list');if(!list||document.getElementById('farmer-detail-panel'))return;const panel=document.createElement('div');panel.id='farmer-detail-panel';panel.className='status';panel.style.display='none';panel.style.marginBottom='.85rem';list.insertAdjacentElement('beforebegin',panel)}
function formatPlotLabel(plotNumber=1){return `Plot ${Number(plotNumber||1)}`}
function generateFarmerGroupId(){return `farmer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function buildFarmerContextKey(entry={}){return [entry.surveyName||'',entry.ownerName||'',entry.farmName||'',entry.province||'',entry.district||''].map(value=>String(value||'').trim().toLowerCase()).join('|')}
function buildFarmerSummaryDraft(values={}){return{surveyName:values.surveyName||'',ownerName:values.ownerName||'',farmName:values.farmName||'',province:values.province||'',district:values.district||''}}
function setFarmerPlotContext(groupId=null,plotNumber=1,contextKey='',summaryDraft=null){activeFarmerGroupId=groupId||null;activeFarmerPlotNumber=Number(plotNumber||1)||1;activeFarmerContextKey=contextKey||'';activeFarmerSummaryDraft=summaryDraft||null;window.CropCollectorApp?.state?.assign?.({activeFarmerGroupId,activeFarmerPlotNumber,activeFarmerContextKey,activeFarmerSummaryDraft});updateFarmerSummaryPanel();updateMobileSaveFlowState?.()}
function resolveFarmerPlotContext(summaryDraft={}){const contextKey=buildFarmerContextKey(summaryDraft);const sameContext=contextKey&&activeFarmerContextKey===contextKey&&activeFarmerGroupId;return{contextKey,farmerGroupId:sameContext?activeFarmerGroupId:null,plotNumber:sameContext?(Number(activeFarmerPlotNumber||1)||1):1}}
function rememberFarmerContinuationState(draft={}){lastSavedFarmerChain={surveyName:draft.surveyName||'',ownerName:draft.ownerName||'',farmName:draft.farmName||'',province:draft.province||'',district:draft.district||'',ward:draft.ward||'',aez:draft.aez||'',sector:draft.sector||'',farmerGroupId:draft.farmerGroupId||null,nextPlotNumber:(Number(draft.plotNumber||1)||1)+1,cropPlan:[...(currentCropPlan||[])],cropPlanIndex:Number(currentCropPlanIndex||0)||0};window.CropCollectorApp?.state?.set?.('lastSavedFarmerChain',lastSavedFarmerChain)}
function buildFarmerContinuationState(draft={}){return{surveyName:draft.surveyName||'',ownerName:draft.ownerName||'',farmName:draft.farmName||'',province:draft.province||'',district:draft.district||'',ward:draft.ward||'',aez:draft.aez||'',sector:draft.sector||'',farmerGroupId:draft.farmerGroupId||activeFarmerGroupId||generateFarmerGroupId(),nextPlotNumber:(Number(draft.plotNumber||1)||1)+1,cropPlan:[...(currentCropPlan||[])],cropPlanIndex:Number(currentCropPlanIndex||0)||0}}
function applyFarmerContinuationState(state={},options={}){setFarmerPlotContext(state.farmerGroupId||null,state.nextPlotNumber||1,buildFarmerContextKey(state),state);lastSavedFarmerChain={...state};window.CropCollectorApp?.state?.set?.('lastSavedFarmerChain',lastSavedFarmerChain);const setters=[['survey-name',state.surveyName],['owner-name',state.ownerName],['farm-name',state.farmName],['province',state.province],['district',state.district],['ward',state.ward],['aez',state.aez],['sector',state.sector],['questionnaire-id','']];setters.forEach(([id,value])=>{const field=document.getElementById(id);if(field)field.value=value||''});if(Array.isArray(state.cropPlan)&&state.cropPlan.length){currentCropPlan=[...state.cropPlan];currentCropPlanIndex=Number(state.cropPlanIndex||0)||0;window.CropCollectorApp?.state?.assign?.({currentCropPlan,currentCropPlanIndex})}updateQuestionnaireProgress?.();if(options.statusMessage)updateOfflineStatus?.(options.statusMessage)}
function continueWithLastSavedFarmer(){if(!lastSavedFarmerChain)return;applyFarmerContinuationState(lastSavedFarmerChain,{statusMessage:`Continuing with ${lastSavedFarmerChain.ownerName||'the last farmer'}. Draw ${formatPlotLabel(lastSavedFarmerChain.nextPlotNumber||1)} and keep collecting.`});showCollectorFeedback?.(`Continuing with ${lastSavedFarmerChain.ownerName||'the last farmer'}.`,'info')}
function updateFarmerSummaryPanel(){const panel=document.getElementById('farmer-summary-panel');if(!panel)return;const entries=Array.isArray(window.fieldEntries)?window.fieldEntries:[];const ownerName=document.getElementById('owner-name')?.value?.trim()||'';const farmName=document.getElementById('farm-name')?.value?.trim()||'';const surveyName=document.getElementById('survey-name')?.value?.trim()||'';const matchingEntries=ownerName?entries.filter(entry=>String(entry.ownerName||'').trim()===ownerName):[];const title=document.getElementById('farmer-summary-title');const plots=document.getElementById('farmer-summary-plots');const area=document.getElementById('farmer-summary-area');const next=document.getElementById('farmer-summary-next');const crops=document.getElementById('farmer-summary-crops');const note=document.getElementById('farmer-summary-note');const actions=document.getElementById('farmer-summary-actions');const totalArea=matchingEntries.reduce((sum,entry)=>sum+Number(entry.area||0),0);const cropLabels=[...new Set(matchingEntries.map(entry=>entry.cropName||entry.cropType||'').filter(Boolean))];if(!ownerName&&!matchingEntries.length){panel.style.display='none';return}panel.style.display='block';if(title)title.textContent=ownerName?`${ownerName}${farmName?` â€¢ ${farmName}`:''}`:'Current farmer summary';if(plots)plots.textContent=String(matchingEntries.length);if(area)area.textContent=totalArea.toFixed(2);if(next)next.textContent=String(matchingEntries.length+1);if(crops)crops.textContent=cropLabels.length?`Recorded crops: ${cropLabels.join(', ')}`:'No crops recorded yet for this farmer.';if(note)note.textContent=surveyName?`Survey: ${surveyName}. Continue with the same farmer or start a new record.`:'Continue with the same farmer or start a new record.';if(actions)actions.style.display=matchingEntries.length?'block':'none'}
function updateFarmerDetailPanel(){const panel=document.getElementById('farmer-detail-panel');if(!panel)return;const entries=Array.isArray(window.fieldEntries)?window.fieldEntries:[];const selectedKey=window.selectedFarmerGroupKey||'';if(!selectedKey){panel.style.display='none';panel.innerHTML='';return}const matchingEntries=entries.filter(entry=>window.getEntryGroupKey?window.getEntryGroupKey(entry)===selectedKey:false);if(!matchingEntries.length){panel.style.display='none';panel.innerHTML='';return}const first=matchingEntries[0]||{};const totalArea=matchingEntries.reduce((sum,entry)=>sum+Number(entry.area||0),0);panel.style.display='block';panel.innerHTML=`<strong>${first.ownerName||'Selected farmer'}</strong><div style="margin-top:.45rem;font-size:.82rem;color:#49604c">${first.farmName||'Farm not set'} | ${matchingEntries.length} plot${matchingEntries.length===1?'':'s'} | ${totalArea.toFixed(2)} ha</div><div style="margin-top:.35rem;font-size:.8rem;color:#5f6f5f">${matchingEntries.map(entry=>entry.cropName||entry.cropType||'').filter(Boolean).join(', ')||'No crop details yet.'}</div>`}
function injectCollectorQuickMenu(){const sidebar=document.getElementById('sidebar');if(!sidebar||document.getElementById('collector-quick-menu'))return;const menu=document.createElement('div');menu.id='collector-quick-menu';menu.className='section';menu.innerHTML=`<h2><i data-feather="grid"></i> Quick Menu</h2><div class="quick-menu-grid quick-menu-grid-primary"><button type="button" id="quick-menu-collect" data-nav-area="collect">Collect</button><button type="button" id="quick-menu-entries" class="secondary" data-nav-area="entries">Entries</button><button type="button" id="quick-menu-validate" class="secondary" data-nav-area="validate">Validate</button></div><details id="quick-menu-more" class="compact-menu quick-menu-more" open><summary><span>More tools</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"><div class="quick-menu-grid quick-menu-grid-secondary"><button type="button" id="quick-menu-settings" class="secondary" data-nav-area="settings">Settings</button><button type="button" id="quick-menu-ops" class="secondary" data-nav-area="ops">Operations</button><button type="button" id="quick-menu-offline" class="secondary" data-nav-area="offline">Offline</button></div><div class="mobile-account-actions"><a id="quick-menu-admin" href="admin-dashboard.html" class="secondary" style="display:none;text-decoration:none"><i data-feather="shield"></i> Admin</a><button type="button" id="quick-menu-logout" class="secondary"><i data-feather="log-out"></i> Logout</button><button type="button" id="quick-menu-theme" class="secondary theme-wide"><i data-feather="moon"></i> Theme</button></div></div></details><div class="quick-menu-note">Main collection tools stay up front. Extra tools collapse when you do not need them.</div>`;if(!menu.dataset.delegatedNav){const handleNav=event=>{const button=event.target?.closest?.('[data-nav-area]');if(!button||button.disabled)return;event.preventDefault?.();event.stopPropagation?.();jumpToSidebarArea(button.dataset.navArea)};menu.addEventListener('click',handleNav);menu.addEventListener('touchend',handleNav,{passive:false});menu.dataset.delegatedNav='true'}sidebar.insertBefore(menu,sidebar.firstChild)}
function injectCollectorSettingsPanel(){const sidebar=document.getElementById('sidebar');if(!sidebar||document.getElementById('collector-settings-section'))return;const section=document.createElement('div');section.id='collector-settings-section';section.className='section';section.innerHTML=`<h2><i data-feather="settings"></i> Settings</h2><div class="ops-panel"><div class="status" id="settings-guidance">Keep the map steady, refresh field lists, and use portrait mode on phone for the cleanest collection flow.</div><div class="button-group" id="settings-map-actions"><button type="button" id="toggle-map-lock" class="secondary" data-settings-action="toggle-map-lock"><i data-feather="lock"></i> Lock Map Movement</button><button type="button" id="toggle-orientation-lock" class="secondary" data-settings-action="toggle-orientation-lock"><i data-feather="smartphone"></i> Keep Portrait Layout</button><button type="button" id="settings-refresh-reference-data" class="secondary" data-settings-action="refresh-reference-data"><i data-feather="refresh-cw"></i> Refresh Reference Data</button></div><div class="ops-grid" style="margin-top:.8rem"><div class="ops-item"><strong>Map Movement</strong><span id="settings-map-lock-status">Unlocked</span></div><div class="ops-item"><strong>Map Orientation</strong><span id="settings-map-orientation-status">North up</span></div><div class="ops-item"><strong>Phone Layout</strong><span id="settings-phone-layout-status">Portrait recommended</span></div><div class="ops-item"><strong>Rotation Control</strong><span id="settings-orientation-lock-status">Browser default</span></div><div class="ops-item"><strong>Tool Layout</strong><span id="settings-tool-layout-status">Settings separated from collection</span></div></div></div>`;if(!section.dataset.delegatedSettings){const handleSettings=event=>{const button=event.target?.closest?.('[data-settings-action]');if(!button||button.disabled)return;event.preventDefault?.();event.stopPropagation?.();if(button.dataset.settingsAction==='toggle-map-lock')toggleMapInteractionLock();else if(button.dataset.settingsAction==='toggle-orientation-lock')togglePortraitLockPreference().catch(()=>updateOrientationControls('Portrait preference saved'));else if(button.dataset.settingsAction==='refresh-reference-data')refreshReferenceData()};section.addEventListener('click',handleSettings);section.addEventListener('touchend',handleSettings,{passive:false});section.dataset.delegatedSettings='true'}const quickMenu=document.getElementById('collector-quick-menu');if(quickMenu?.nextSibling)sidebar.insertBefore(section,quickMenu.nextSibling);else sidebar.appendChild(section)}
function injectMobileWorkspaceDock(){const app=document.getElementById('app');if(!app||document.getElementById('mobile-workspace-dock'))return;const dock=document.createElement('div');dock.id='mobile-workspace-dock';dock.className='mobile-workspace-dock';dock.setAttribute('role','tablist');dock.setAttribute('aria-label','Mobile workspace');dock.innerHTML=`<button type="button" id="mobile-workspace-map" class="secondary"><i data-feather="map"></i><span>Map View</span></button><button type="button" id="mobile-workspace-collect" class="secondary"><i data-feather="edit-3"></i><span>Collect</span></button><button type="button" id="mobile-workspace-entries" class="secondary"><i data-feather="database"></i><span>Entries</span></button><button type="button" id="mobile-workspace-settings" class="secondary"><i data-feather="settings"></i><span>Settings</span></button>`;app.appendChild(dock)}
function injectCollectorSubmenus(){const createDrawer=(id,title,open=false)=>{const drawer=document.createElement('details');drawer.id=id;drawer.className='compact-menu';if(open||useOdkCollectorLayout())drawer.open=true;drawer.innerHTML=`<summary><span>${title}</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;drawer.addEventListener('toggle',()=>feather.replace());return drawer};const moveInput=(inputId,target)=>{const input=document.getElementById(inputId);const group=input?.closest('.input-group');if(group&&target&&!target.contains(group))target.appendChild(group)};const form=document.getElementById('crop-form');if(form&&!document.getElementById('collect-production-drawer')){const saveBtn=document.getElementById('save-entry-btn');const productionDrawer=createDrawer('collect-production-drawer','Season, Irrigation & Yield');const productionBody=productionDrawer.querySelector('.compact-menu-body');['crop-condition','season','irrigation-type','planting-date','harvest-date','yield-expected','yield-tonnes'].forEach(id=>moveInput(id,productionBody));saveBtn?.insertAdjacentElement('beforebegin',productionDrawer)}if(form&&!document.getElementById('collect-observation-drawer')){const saveBtn=document.getElementById('save-entry-btn');const notesDrawer=createDrawer('collect-observation-drawer','Observations, Notes & Photos');const notesBody=notesDrawer.querySelector('.compact-menu-body');const photoBlock=document.getElementById('photo-file')?.parentElement;['observation-notes','post-harvest-assessment','notes'].forEach(id=>moveInput(id,notesBody));if(photoBlock&&!notesBody.contains(photoBlock))notesBody.insertBefore(photoBlock,notesBody.querySelector('.input-group')||notesBody.firstChild);saveBtn?.insertAdjacentElement('beforebegin',notesDrawer)}const quickMenu=document.getElementById('collector-quick-menu');if(quickMenu&&!quickMenu.querySelector('.quick-menu-note'))quickMenu.insertAdjacentHTML('beforeend','<div class="quick-menu-note">Main areas stay on top. Extra tools open only when you need them.</div>');const entriesSection=document.getElementById('fields-list')?.closest('.section');const exportButtons=document.getElementById('export-csv')?.closest('.button-group');if(entriesSection&&exportButtons&&!document.getElementById('entries-tools-drawer')){const exportDrawer=createDrawer('entries-tools-drawer','Export & Clear Tools');exportDrawer.querySelector('.compact-menu-body').appendChild(exportButtons);entriesSection.appendChild(exportDrawer)}const opsPanel=document.getElementById('ops-app-version')?.closest('.ops-panel');const opsHistory=document.querySelector('.ops-history');if(opsPanel&&opsHistory&&!document.getElementById('ops-history-drawer')){const historyDrawer=createDrawer('ops-history-drawer','Sent to Server History');historyDrawer.querySelector('.compact-menu-body').appendChild(opsHistory);opsPanel.appendChild(historyDrawer)}const offlineSection=document.getElementById('offline-status')?.closest('.section');const mbtilesButtons=document.getElementById('upload-mbtiles')?.closest('.button-group');const syncButtons=document.getElementById('push-all-server')?.closest('.button-group');const mbtilesInput=ensureMbtilesInput();if(offlineSection&&mbtilesButtons&&!document.getElementById('basemap-tools-drawer')){const basemapDrawer=createDrawer('basemap-tools-drawer','Basemap Tools');basemapDrawer.querySelector('.compact-menu-body').appendChild(mbtilesButtons);offlineSection.insertBefore(basemapDrawer,mbtilesInput)}if(offlineSection&&syncButtons&&!document.getElementById('sync-tools-drawer')){const syncDrawer=createDrawer('sync-tools-drawer','Sync Tools');syncDrawer.querySelector('.compact-menu-body').appendChild(syncButtons);offlineSection.insertBefore(syncDrawer,mbtilesInput)}feather.replace()}
function injectMbtilesFallbackPicker(){const offlineSection=document.getElementById('offline-status')?.closest('.section');if(!offlineSection)return;const status=document.getElementById('offline-status');const uploadButton=document.getElementById('upload-mbtiles');if(uploadButton)uploadButton.setAttribute('onclick','if(window.__collectorOpenMbtilesPicker){ return window.__collectorOpenMbtilesPicker(); }');if(!document.getElementById('mbtiles-file-direct')){const fallback=document.createElement('div');fallback.className='odk-file-fallback';fallback.innerHTML='<strong>MBTiles direct file chooser</strong><div style="font-size:.78rem;color:#5f6f5f">If the upload button does not open the picker, choose the MBTiles file directly here.</div><input type="file" id="mbtiles-file-direct" accept=".mbtiles,.sqlite,.db,application/octet-stream" onchange="if(window.__collectorHandleMbtilesDirect){ window.__collectorHandleMbtilesDirect(this); }">';offlineSection.insertBefore(fallback,status)}if(!document.getElementById('mbtiles-debug-status')){const debug=document.createElement('div');debug.id='mbtiles-debug-status';debug.className='status';debug.hidden=true;debug.style.marginTop='.65rem';debug.style.background='#f5faf5';debug.style.color='#49604c';debug.style.fontSize='.8rem';offlineSection.insertBefore(debug,status)}}
function injectReferenceDataTools(){const opsPanel=document.getElementById('ops-app-version')?.closest('.ops-panel');if(!opsPanel||document.getElementById('reference-data-tools'))return;const tools=document.createElement('div');tools.id='reference-data-tools';tools.className='button-group';tools.innerHTML='<button type="button" id="refresh-reference-data" class="secondary"><i data-feather="refresh-cw"></i> Refresh Reference Data</button>';opsPanel.insertBefore(tools,opsPanel.querySelector('.ops-history-drawer, #ops-history-drawer, .ops-history')||null);feather.replace()}
CollectorApp.registerModule('db',{
  initLocalQueueFromIndexedDB,
  saveQueueToIndexedDB,
  refreshReferenceData,
  loadLookupCatalog,
  loadAvailableSurveys,
  applyAppVersionMigrations,
  registerAppServiceWorker,
  enforceProvisionedAccessUI
});




