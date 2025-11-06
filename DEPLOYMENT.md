# Deployment Guide

This app requires both a frontend (React) and a backend (Node.js/Express/Socket.io) server.

## Option 1: Full-Stack Hosting (Recommended)

Deploy both frontend and backend together on platforms that support Node.js:

### Free Options:
- **Render** (https://render.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available  
- **Fly.io** (https://fly.io) - Free tier available
- **Heroku** - Has a free tier but with limitations

### Render Deployment (Recommended)

1. **Backend Setup:**
   - Create a new "Web Service" on Render
   - Connect your GitHub repository
   - Build command: (leave empty, Render auto-detects)
   - Start command: `npm run server`
   - Environment: `Node`
   - Add environment variable: `PORT=3001`

2. **Frontend Setup:**
   - Create a new "Web Service" on Render
   - Connect your GitHub repository
   - Root directory: `client`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s build -l 3000`
   - Add environment variable: `REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com`

## Option 2: GitHub Pages + Separate Backend (Hybrid)

Deploy frontend to GitHub Pages and backend to a Node.js hosting service.

### Backend Hosting:
Use one of the services from Option 1 to host the backend.

### Frontend (GitHub Pages) Setup:

1. **Update package.json in client folder:**
   ```json
   {
     "homepage": "https://YOUR_USERNAME.github.io/photoshop-but-better"
   }
   ```

2. **Create GitHub Actions workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
     workflow_dispatch:
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout
         uses: actions/checkout@v3
       
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
       
       - name: Install dependencies
         run: |
           cd client
           npm install
       
       - name: Build
         run: |
           cd client
           npm run build
         env:
           REACT_APP_SOCKET_URL: ${{ secrets.SOCKET_URL }}
       
       - name: Deploy
         uses: peaceiris/actions-gh-pages@v3
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./client/build
   ```

3. **Set GitHub Secrets:**
   - Go to Settings → Secrets → Actions
   - Add `SOCKET_URL` with your backend server URL (e.g., `https://your-backend.onrender.com`)

4. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: `gh-pages` branch
   - Save

## Option 3: Single Service (Easiest)

Deploy everything to one service that can handle both:

### Railway (Simplest)

1. Create new project on Railway
2. Connect GitHub repo
3. Add environment variable: `REACT_APP_SOCKET_URL=https://your-app.up.railway.app`
4. Railway will auto-detect and deploy both frontend and backend

### Render (Alternative)

1. Create two services (backend + frontend)
2. Follow Option 1 instructions above

## Environment Variables

### Backend (.env):
```
PORT=3001
HOST=0.0.0.0
```

### Frontend:
```
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

## Quick Start Commands

### Local Development:
```bash
npm run dev
```

### Build for Production:
```bash
cd client
npm run build
```

### Run Production Build Locally:
```bash
cd client
npm install -g serve
serve -s build -l 3000
```

## Important Notes

- **GitHub Pages is static only** - Cannot run Node.js backend
- **Backend must be publicly accessible** - Frontend needs to connect via WebSocket
- **CORS must be configured** - Backend allows all origins in current setup
- **HTTPS required** - Most browsers require HTTPS for WebSocket connections in production

## Troubleshooting

### Frontend can't connect to backend:
- Verify `REACT_APP_SOCKET_URL` is set correctly
- Check backend is accessible via browser
- Ensure CORS is configured on backend
- Check firewall/network settings

### GitHub Pages shows 404:
- Ensure `homepage` is set in package.json
- Use HashRouter instead of BrowserRouter (see below)

### Routing issues on GitHub Pages:
If using GitHub Pages, you may need to switch to HashRouter:

```javascript
// In App.js, change:
import { HashRouter as Router } from 'react-router-dom';
// Instead of BrowserRouter
```

