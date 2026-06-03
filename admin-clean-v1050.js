(function(){
  function compactDetails(){
    if(window.innerWidth > 780) return;
    ["admin-feature-exports","admin-feature-sync","admin-feature-validation"].forEach(id => {
      const el = document.getElementById(id);
      if(el && !el.dataset.adminCleanInitialized){
        el.open = false;
        el.dataset.adminCleanInitialized = "true";
      }
    });
    const offline = document.querySelector("#admin-offline-workflow details");
    if(offline && !offline.dataset.adminCleanInitialized){
      offline.open = false;
      offline.dataset.adminCleanInitialized = "true";
    }
  }

  function trimHeaderLabels(){
    if(window.innerWidth > 780) return;
    const collector = document.querySelector('header .action[href*="WELCOME"]');
    if(collector) collector.textContent = "Collector";
    const refresh = document.getElementById("refresh-btn");
    if(refresh) refresh.textContent = "Refresh";
  }

  function markSystemMetricCards(){
    ["admin-frontend-version","admin-backend-version","admin-postgis-status"].forEach(id => {
      const card = document.getElementById(id)?.closest(".card");
      if(card) card.classList.add("admin-system-card");
    });
  }

  function moveOfflineWorkflow(){
    if(window.innerWidth > 780) return;
    const workflow = document.getElementById("admin-offline-workflow");
    const layout = document.querySelector("main.shell .dashboard-layout");
    if(!workflow || !layout) return;
    layout.insertAdjacentElement("afterend", workflow);
    workflow.dataset.adminCleanMoved = "true";
  }

  function markReady(){
    document.body.classList.add("admin-clean-v1050");
    markSystemMetricCards();
    compactDetails();
    trimHeaderLabels();
    moveOfflineWorkflow();
  }

  document.addEventListener("DOMContentLoaded", markReady);
  window.addEventListener("load", () => {
    markReady();
    setTimeout(trimHeaderLabels, 500);
    setTimeout(trimHeaderLabels, 1800);
    [250, 900, 2200].forEach(delay => setTimeout(moveOfflineWorkflow, delay));
  });
  window.addEventListener("resize", () => requestAnimationFrame(markReady));
})();
