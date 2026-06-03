
(function(){
  function normalizeCards(){
    const cards = document.querySelectorAll("#summary-grid .card,.summary-grid .card,.dashboard-view .card,.stat-card,.kpi-card,.metric-card,.overview-card,.summary-card");
    cards.forEach(function(card){
      card.style.wordBreak = "normal";
      card.style.overflowWrap = "normal";
      card.style.height = "auto";
      card.style.minHeight = "96px";

      const firstStrong = card.querySelector(":scope > strong:first-child");
      if(firstStrong){
        firstStrong.style.fontSize = "0.78rem";
        firstStrong.style.lineHeight = "1.25";
        firstStrong.style.wordBreak = "normal";
        firstStrong.style.overflowWrap = "normal";
      }

      card.querySelectorAll("span,.system-metric,.value").forEach(function(el){
        el.style.fontSize = el.id && el.id.includes("postgis") ? "1.05rem" : "1.45rem";
        el.style.lineHeight = "1.2";
        el.style.wordBreak = "normal";
        el.style.overflowWrap = "anywhere";
      });
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", normalizeCards, {once:true});
  }else{
    normalizeCards();
  }

  setTimeout(normalizeCards, 500);
  setTimeout(normalizeCards, 1500);
})();
