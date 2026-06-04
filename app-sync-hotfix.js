
(function installCropCollectorAuthAndStartupHotfix(){
  const ACCESS_TOKEN_KEY='access_token';

  function getApiUrl(){
    if(window.CROP_COLLECTOR_API_BASE) return window.CROP_COLLECTOR_API_BASE;
    const host = window.location.hostname || '127.0.0.1';
    const isLocal = host === 'localhost' || host === '127.0.0.1' || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if(!isLocal) return 'https://crop-collector-backend.onrender.com/api/v1';
    return `http://${host === 'localhost' ? '127.0.0.1' : host}:8000/api/v1`;
  }

  function safeBase64Json(part){
    try{
      if(!part) return null;
      const padded=part.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4 - part.length % 4) % 4);
      return JSON.parse(atob(padded));
    }catch{return null;}
  }

  function decodeToken(token){
    const payload=safeBase64Json(String(token||'').split('.')[1]);
    if(!payload) return null;
    return normalizeUser(payload);
  }

  function normalizeUser(raw){
    raw=raw||{};
    const username=raw.username || raw.user_name || raw.preferred_username || raw.email || raw.sub || raw.name || 'Logged in User';
    const role=String(raw.role || raw.user_role || raw.userType || raw.user_type || '').toLowerCase();
    const roles=Array.isArray(raw.roles) ? raw.roles.map(r=>String(r).toLowerCase()) : [];
    const isAdmin=raw.is_admin===true || raw.is_superuser===true || raw.admin===true || role==='admin' || role==='superuser' || roles.includes('admin') || roles.includes('superuser');
    return {
      ...raw,
      id: raw.id || raw.user_id || raw.sub || username,
      username,
      email: raw.email || '',
      displayName: raw.displayName || raw.display_name || raw.full_name || raw.name || username,
      role: isAdmin ? 'admin' : (role || 'user'),
      is_admin: isAdmin,
      is_superuser: raw.is_superuser===true || isAdmin
    };
  }

  async function fetchJsonWithToken(url, token){
    const res=await fetch(url,{headers:{'Accept':'application/json','Authorization':`Bearer ${token}`}});
    if(!res.ok) throw new Error(`${url} returned HTTP ${res.status}`);
    return await res.json();
  }

  async function getSafeUser(){
    const token=localStorage.getItem(ACCESS_TOKEN_KEY);
    if(!token) return normalizeUser({username:'guest', displayName:'Guest User', role:'guest'});
    const api=getApiUrl();
    const endpoints=[`${api}/users/me`, `${api}/auth/me`, `${api}/auth/users/me`, `${api}/me`];
    for(const ep of endpoints){
      try{
        const data=await fetchJsonWithToken(ep, token);
        const user=normalizeUser(data);
        localStorage.setItem('collector_user', JSON.stringify(user));
        return user;
      }catch(e){
        console.debug('[AuthHotfix] user endpoint failed:', e.message);
      }
    }
    const decoded=decodeToken(token) || normalizeUser({username:'Logged in User', displayName:'Logged in User', role:'user'});
    localStorage.setItem('collector_user', JSON.stringify(decoded));
    return decoded;
  }

  function applyUserToUi(user){
    user=normalizeUser(user);
    window.currentUser=user;
    window.authUser=user;
    window.collectorUser=user;
    const usernameDisplay=document.getElementById('username-display');
    const adminLink=document.getElementById('admin-link');
    const logoutBtn=document.getElementById('logout-btn');
    if(usernameDisplay) usernameDisplay.textContent=user.displayName || user.username || 'Logged in User';
    if(logoutBtn) logoutBtn.style.display='inline-flex';
    if(adminLink) adminLink.style.display=user.is_admin || user.is_superuser ? 'inline-flex' : 'none';
    const collector=document.getElementById('ops-collector');
    if(collector) collector.textContent=user.displayName || user.username || 'Logged in User';
  }

  window.__collectorGetSafeUser=getSafeUser;
  window.__collectorApplyUserToUi=applyUserToUi;

  // Wrap startApp if it exists. This prevents crashes caused by null user.displayName.
  const wrap=()=>{
    if(typeof window.startApp!=='function' || window.startApp.__safeWrapped) return;
    const originalStartApp=window.startApp;
    const wrapped=async function safeStartApp(user){
      const safeUser=normalizeUser(user || window.currentUser || window.authUser || window.collectorUser || JSON.parse(localStorage.getItem('collector_user')||'null') || {username:'Logged in User', displayName:'Logged in User'});
      applyUserToUi(safeUser);
      try{
        return await originalStartApp.call(this, safeUser);
      }catch(error){
        if(String(error?.message||'').includes('displayName')){
          console.warn('[AuthHotfix] startApp had null displayName. Retrying with safe user.', error);
          applyUserToUi(safeUser);
          return await originalStartApp.call(this, safeUser);
        }
        throw error;
      }
    };
    wrapped.__safeWrapped=true;
    window.startApp=wrapped;
  };

  wrap();
  setTimeout(wrap,0);
  setTimeout(wrap,100);
})();
