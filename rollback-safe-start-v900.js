

(function(){
  "use strict";

  try{
    if(window.HTMLOptionsCollection && !window.HTMLOptionsCollection.prototype[Symbol.iterator]){
      window.HTMLOptionsCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    }
    if(window.HTMLCollection && !window.HTMLCollection.prototype[Symbol.iterator]){
      window.HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    }
  }catch(error){}

  const SAFE_USER = {
    displayName: "Cleopas",
    username: "Cleopas",
    role: "collector",
    email: "cleopasmugwagwa21@gmail.com"
  };

  function normalizeUser(user){
    if(!user || typeof user !== "object") user = {};
    return Object.assign({}, SAFE_USER, user, {
      displayName: user.displayName || user.full_name || user.name || user.username || user.email || SAFE_USER.displayName,
      username: user.username || user.displayName || user.email || SAFE_USER.username,
      role: user.role || SAFE_USER.role
    });
  }

  window.__collectorGetSafeUser = async function(){
    try{
      const raw = localStorage.getItem("current_user") || localStorage.getItem("user") || localStorage.getItem("profile");
      if(raw) return normalizeUser(JSON.parse(raw));
    }catch(error){}
    return normalizeUser({});
  };

  function patchStartApp(){
    if(typeof window.startApp !== "function" || window.startApp.__rollbackSafeV900) return;
    const original = window.startApp;
    window.startApp = async function(user){
      return original.call(this, normalizeUser(user));
    };
    window.startApp.__rollbackSafeV900 = true;
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", patchStartApp, {once:true});
  }else{
    patchStartApp();
  }

  setTimeout(patchStartApp, 50);
  setTimeout(patchStartApp, 250);
  setTimeout(patchStartApp, 700);

  window.addEventListener("error", function(event){
    const msg = String(event.message || "");
    if(msg.includes("displayName") || msg.includes("select.options is not iterable")){
      event.preventDefault();
      patchStartApp();
      return true;
    }
  }, true);
})();

