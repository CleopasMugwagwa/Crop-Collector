# Crop Collector Frontend Deployment

Deploy repository:

```text
https://github.com/CleopasMugwagwa/Crop-Collector
```

Recommended host:

```text
Netlify
```

If `WELCOME.html` is in the repository root, use:

```text
Publish directory: .
Build command: leave empty
```

If `WELCOME.html` is inside a `frontend` folder in GitHub, use:

```text
Publish directory: frontend
Build command: leave empty
```

After backend deployment, edit `frontend-config.js`:

```js
window.CROP_COLLECTOR_API_BASE = "https://your-render-backend.onrender.com/api/v1";
```

Redeploy Netlify after the change.
