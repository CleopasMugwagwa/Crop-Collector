

(function(){
  "use strict";

  // Fix old Chromium/Live Server edge case: app-db.js uses select.options as iterable.
  try{
    if(window.HTMLOptionsCollection && !window.HTMLOptionsCollection.prototype[Symbol.iterator]){
      window.HTMLOptionsCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    }
    if(window.HTMLCollection && !window.HTMLCollection.prototype[Symbol.iterator]){
      window.HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    }
  }catch(error){}

  window.__SAFE_COLLECTOR_USER_V850 = {
    displayName: "Cleopas",
    username: "Cleopas",
    role: "collector",
    email: "cleopasmugwagwa21@gmail.com"
  };

  window.__normalizeCollectorUserV850 = function(user){
    const safe = window.__SAFE_COLLECTOR_USER_V850;
    if(!user || typeof user !== "object") user = {};
    return Object.assign({}, safe, user, {
      displayName: user.displayName || user.full_name || user.name || user.username || user.email || safe.displayName,
      username: user.username || user.displayName || user.email || safe.username,
      role: user.role || safe.role
    });
  };

  window.__collectorGetSafeUser = async function(){
    try{
      const raw = localStorage.getItem("current_user") || localStorage.getItem("user") || localStorage.getItem("profile");
      if(raw) return window.__normalizeCollectorUserV850(JSON.parse(raw));
    }catch(error){}
    return window.__normalizeCollectorUserV850({});
  };
})();

