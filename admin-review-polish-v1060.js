(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }

  function ensureReviewDecisionBar(){
    const actions = document.querySelector(".review-actions");
    if(!actions || $("admin-review-decision-bar")) return;

    const bar = document.createElement("div");
    bar.id = "admin-review-decision-bar";
    bar.className = "admin-review-decision-bar";
    bar.innerHTML = `
      <button type="button" data-review-decision="approved">Approve</button>
      <button type="button" data-review-decision="rejected" class="danger">Reject</button>
      <button type="button" data-review-decision="needs_correction" class="secondary">Needs Correction</button>
      <button type="button" data-review-decision="uncertain" class="secondary">Uncertain</button>
    `;
    actions.insertAdjacentElement("beforebegin", bar);

    bar.querySelectorAll("[data-review-decision]").forEach(button => {
      button.addEventListener("click", () => applyDecision(button.dataset.reviewDecision));
    });
  }

  function applyDecision(decision){
    const review = $("review-status-input");
    const comment = $("review-comment-input");
    if(!review || !comment) return;

    const map = {
      approved: {
        status: "approved",
        note: "Approved. Geometry, crop/livestock attributes, and evidence accepted."
      },
      rejected: {
        status: "rejected",
        note: "Rejected. Record should not be used for analysis until corrected."
      },
      needs_correction: {
        status: "pending_review",
        note: "Needs correction. Send back for missing or weak field evidence."
      },
      uncertain: {
        status: "reviewed",
        note: "Reviewed as uncertain. Keep record flagged for supervisor attention."
      }
    };

    const next = map[decision] || map.uncertain;
    review.value = next.status;
    if(!String(comment.value || "").trim()) comment.value = next.note;
    updateEvidencePanel();
    comment.focus();
  }

  function ensureEvidencePanel(){
    const summary = $("review-record-summary");
    if(!summary || $("admin-review-evidence-summary")) return;

    const panel = document.createElement("div");
    panel.id = "admin-review-evidence-summary";
    panel.className = "admin-review-evidence-summary";
    panel.innerHTML = `
      <div><strong>Geometry</strong><span id="admin-evidence-geometry">Select record</span></div>
      <div><strong>Photo</strong><span id="admin-evidence-photo">Select record</span></div>
      <div><strong>Decision</strong><span id="admin-evidence-decision">Pending</span></div>
    `;
    summary.insertAdjacentElement("afterend", panel);
  }

  function updateEvidencePanel(){
    ensureReviewDecisionBar();
    ensureEvidencePanel();

    const targetText = $("review-target")?.textContent || "";
    const summaryText = $("review-record-summary")?.textContent || "";
    const photoVisible = $("review-photo-panel") && getComputedStyle($("review-photo-panel")).display !== "none";
    const photoName = $("review-photo-name")?.textContent || "";
    const reviewStatus = $("review-status-input")?.value || "pending_review";
    const selected = !/Select a record/i.test(targetText);

    const geometryNode = $("admin-evidence-geometry");
    const photoNode = $("admin-evidence-photo");
    const decisionNode = $("admin-evidence-decision");

    if(geometryNode){
      geometryNode.textContent = selected ? "Check map/record geometry before approval" : "Select record";
      geometryNode.dataset.state = selected ? "warn" : "neutral";
    }
    if(photoNode){
      photoNode.textContent = photoVisible ? (photoName || "Attached") : (selected ? "No photo attached" : "Select record");
      photoNode.dataset.state = photoVisible ? "good" : selected ? "bad" : "neutral";
    }
    if(decisionNode){
      decisionNode.textContent = reviewStatus.replace(/_/g, " ");
      decisionNode.dataset.state = reviewStatus === "approved" ? "good" : reviewStatus === "rejected" ? "bad" : "warn";
    }

    document.body.classList.toggle("admin-review-record-selected", selected || !!summaryText.trim());
  }

  function enhanceCorrectionPanel(){
    const hint = $("correction-photo-panel")?.closest(".filter-group")?.querySelector(".correction-photo-hint");
    if(hint){
      hint.textContent = "Attach field photo evidence when a submitted record is missing proof or needs supervisor confirmation.";
    }
    const save = $("save-correction-btn");
    if(save && !save.dataset.reviewPolishText){
      save.dataset.reviewPolishText = "true";
      save.textContent = "Save Corrections";
    }
  }

  function boot(){
    ensureReviewDecisionBar();
    ensureEvidencePanel();
    enhanceCorrectionPanel();
    updateEvidencePanel();

    ["review-status-input","review-comment-input"].forEach(id => {
      $(id)?.addEventListener("change", updateEvidencePanel);
      $(id)?.addEventListener("input", updateEvidencePanel);
    });

    const observer = new MutationObserver(() => requestAnimationFrame(updateEvidencePanel));
    ["review-target","review-record-summary","review-photo-panel","records-table"].forEach(id => {
      const node = $(id);
      if(node) observer.observe(node, {childList:true, subtree:true, attributes:true, characterData:true});
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
