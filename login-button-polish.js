
/* PROFESSIONAL LOGIN BUTTON POLISH v710 */
(function(){
  function qs(s){ return document.querySelector(s); }
  function polish(){
    const sign = qs("#sign-in-btn");
    const create = qs("#create-account-btn");
    const guest = qs("#guest-btn");

    [
      [sign, "Sign In"],
      [create, "Create Account"],
      [guest, "Continue as Guest"]
    ].forEach(function(pair){
      const btn = pair[0];
      if(!btn) return;
      btn.disabled = false;
      btn.removeAttribute("disabled");
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
      btn.setAttribute("aria-label", pair[1]);
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", polish, {once:true});
  else polish();
  setTimeout(polish, 600);
  setTimeout(polish, 1600);
})();
