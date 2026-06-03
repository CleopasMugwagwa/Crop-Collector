(function(){
  const LOCAL_QUEUE_KEY = "local_field_entries_queue";
  function readQueue(){ try{ return JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY)||"[]"); }catch{ return []; } }
  function statusOf(item){ return item.syncStatus || item.sync_status || (item.source === "backend" ? "synced" : "pending"); }
  function moduleOf(item){ return item.primaryModule || item.primary_module || (String(item.questionnaireId||item.questionnaire_id||"").startsWith("LVS-") ? "livestock" : "crop"); }
  function allEntries(){
    const stateEntries = Array.isArray(window.fieldEntries) ? window.fieldEntries : [];
    const queue = readQueue();
    const seen = new Set(stateEntries.map(e => String(e.localId || e.local_id || e.id || "")));
    return stateEntries.concat(queue.filter(e => !seen.has(String(e.localId || e.local_id || e.id || ""))));
  }
  function ensurePanel(){
    const list = document.getElementById("fields-list");
    if(!list) return null;
    let panel = document.getElementById("draft-queue-summary");
    if(!panel){
      panel = document.createElement("div");
      panel.id = "draft-queue-summary";
      panel.className = "draft-queue-summary";
      list.insertAdjacentElement("beforebegin", panel);
    }
    return panel;
  }
  function enhanceEntryCards(){
    document.querySelectorAll("#fields-list .entry").forEach(li => {
      const text = li.innerText || "";
      li.classList.add("draft-queue-card");
      if(/failed/i.test(text)) li.dataset.syncState = "failed";
      else if(/pending/i.test(text)) li.dataset.syncState = "pending";
      else if(/synced/i.test(text)) li.dataset.syncState = "synced";
      if(/outside|low accuracy|gps skipped/i.test(text)) li.classList.add("needs-geofence-review");
    });
  }
  function updateDraftQueueUi(){
    const heading = document.querySelector("#fields-list")?.closest(".section")?.querySelector("h2");
    if(heading){
      const count = document.getElementById("field-count")?.textContent || "0 / 0";
      heading.innerHTML = '<i data-feather="database"></i> Draft Queue (<span id="field-count">'+count+'</span>)';
    }
    const entries = allEntries();
    const pending = entries.filter(e => statusOf(e)==="pending" || statusOf(e)==="in_progress").length;
    const failed = entries.filter(e => statusOf(e)==="failed").length;
    const synced = entries.filter(e => statusOf(e)==="synced" || e.source==="backend").length;
    const crop = entries.filter(e => moduleOf(e)==="crop").length;
    const livestock = entries.filter(e => moduleOf(e)==="livestock").length;
    const panel = ensurePanel();
    if(panel){
      panel.innerHTML = `
        <div class="draft-queue-chip pending"><strong>${pending}</strong><span>Pending</span></div>
        <div class="draft-queue-chip synced"><strong>${synced}</strong><span>Synced</span></div>
        <div class="draft-queue-chip failed"><strong>${failed}</strong><span>Failed</span></div>
        <div class="draft-queue-chip"><strong>${crop}</strong><span>Crop</span></div>
        <div class="draft-queue-chip"><strong>${livestock}</strong><span>Livestock</span></div>`;
    }
    enhanceEntryCards();
    try{ feather.replace(); }catch(e){}
  }
  function patchRenderEntries(){
    if(typeof window.renderEntries !== "function" || window.renderEntries.__draftQueue1050) return;
    const original = window.renderEntries;
    window.renderEntries = function(){
      const result = original.apply(this, arguments);
      setTimeout(updateDraftQueueUi, 0);
      return result;
    };
    window.renderEntries.__draftQueue1050 = true;
  }
  document.addEventListener("DOMContentLoaded", () => {
    patchRenderEntries();
    updateDraftQueueUi();
    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      patchRenderEntries();
      if(window.renderEntries?.__draftQueue1050 || attempts >= 12) clearInterval(retry);
    }, 500);
    const list = document.getElementById("fields-list");
    if(list && !list.dataset.draftQueueObserver){
      list.dataset.draftQueueObserver = "true";
      let scheduled = false;
      new MutationObserver(() => {
        if(scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          updateDraftQueueUi();
        });
      }).observe(list, {childList:true});
    }
  });
  window.CropCollectorDraftQueuePolish = { update:updateDraftQueueUi };
})();
