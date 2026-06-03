/*
  Crop Collector deployment config.

  Local development fallback:
    http://127.0.0.1:8000/api/v1

  For Netlify/Vercel deployment:
    1. Deploy the backend to Render.
    2. Replace the hosted value below with:
       https://your-render-service.onrender.com/api/v1
    3. Commit and redeploy the frontend.
*/
(function(){
  if (window.CROP_COLLECTOR_API_BASE) return;
  const host = window.location.hostname || "127.0.0.1";
  const isLocal = host === "localhost" || host === "127.0.0.1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  window.CROP_COLLECTOR_API_BASE = isLocal
    ? "http://" + (host === "localhost" ? "127.0.0.1" : host) + ":8000/api/v1"
    : "https://your-crop-collector-backend.onrender.com/api/v1";
})();
