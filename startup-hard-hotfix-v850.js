

(function(){
  "use strict";

  function normalize(user){
    if(window.__normalizeCollectorUserV850) return window.__normalizeCollectorUserV850(user);
    const safe = {displayName:"Cleopas", username:"Cleopas", role:"collector", email:"cleopasmugwagwa21@gmail.com"};
    if(!user || typeof user !== "object") user = {};
    return Object.assign({}, safe, user, {
      displayName: user.displayName || user.full_name || user.name || user.username || user.email || safe.displayName,
      username: user.username || user.displayName || user.email || safe.username,
      role: user.role || safe.role
    });
  }

  function patchStartApp(){
    if(typeof window.startApp !== "function") return false;
    if(window.startApp.__hardSafeV850) return true;

    const previousStartApp = window.startApp;
    window.startApp = async function(user){
      const safeUser = normalize(user);
      try{
        return await previousStartApp.call(this, safeUser);
      }catch(error){
        // One more retry with full safe object if an older hotfix still passed null.
        if(String(error && error.message || "").includes("displayName")){
          return await previousStartApp.call(this, normalize({}));
        }
        throw error;
      }
    };
    window.startApp.__hardSafeV850 = true;
    return true;
  }

  patchStartApp();
  setTimeout(patchStartApp, 0);
  setTimeout(patchStartApp, 50);
  setTimeout(patchStartApp, 200);
  setTimeout(patchStartApp, 600);

  window.addEventListener("error", function(event){
    const msg = String(event.message || "");
    if(msg.includes("displayName") || msg.includes("select.options is not iterable")){
      event.preventDefault();
      patchStartApp();
      return true;
    }
  }, true);
})();

