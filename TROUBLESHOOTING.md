# DocuFuse Troubleshooting Guide

## GitHub Pages Shows Nothing

If your GitHub Pages deployment shows a blank page, follow these steps:

### 1. Check Build Status
- Go to your GitHub repository
- Click on the "Actions" tab
- Verify that the latest workflow run completed successfully
- Look for any error messages in the build logs

### 2. Verify GitHub Pages Settings
- Go to **Settings** → **Pages**
- Ensure **Source** is set to "GitHub Actions"
- Note the published URL (should be: https://[username].github.io/DocuFuse/)

### 3. Open Diagnostics Page
Visit: `https://[yourusername].github.io/DocuFuse/diagnostics.html`

This will show:
- ✓ If Puter.js is loaded correctly
- ✓ If AI features are available
- ✓ If modules can be loaded from CDN
- ✓ Current path configuration
- Any errors that might be occurring

### 4. Check Browser Console
1. Open the deployed site
2. Press F12 to open Developer Tools
3. Click on the "Console" tab
4. Look for any errors (usually shown in red)
5. Common errors:
   - **"Failed to fetch"** → Network/CORS issue
   - **"puter is not defined"** → Puter.js failed to load
   - **"Cannot find module"** → Import map or module loading issue

### 5. Test Puter.js Integration
Visit: `https://[yourusername].github.io/DocuFuse/test-puter.html`

This simple test page will verify if Puter.js is working independently.

## Common Issues and Solutions

### Issue: Blank White Page
**Causes:**
- Base path misconfiguration in vite.config.ts
- Module loading failures
- JavaScript errors

**Solutions:**
1. Check browser console for errors
2. Verify the base path matches your repo name: `/DocuFuse/`
3. Try clearing browser cache (Ctrl+Shift+Delete)

### Issue: "Puter.js is not loaded" Error
**Causes:**
- CDN is blocked or slow
- Network connectivity issues
- Content Security Policy blocking the script

**Solutions:**
1. Check if https://js.puter.com/v2/ is accessible in your browser
2. Try the diagnostics page to isolate the issue
3. Check browser extensions (ad blockers might block CDN scripts)

### Issue: Files Don't Process (Stuck on "Processing")
**Causes:**
- Puter.js AI not initialized properly
- API quota exceeded
- Invalid file format

**Solutions:**
1. Run the diagnostics page and test AI functionality
2. Check browser console for specific error messages
3. Try with a different, smaller file
4. Verify Puter.js service status

### Issue: Module Loading Errors
**Error:** "Failed to resolve module specifier" or similar

**Solutions:**
1. The import map in index.html might have issues
2. CDN (esm.sh) might be down or slow
3. Try accessing the CDN directly: https://esm.sh/react@19.2.4

## Development vs Production

### Local Development
```bash
npm install
npm run dev
```
Opens at: http://localhost:3000 with base path: `/`

### Production Build (GitHub Pages)
```bash
GITHUB_PAGES=true npm run build
```
Builds with base path: `/DocuFuse/`

## Getting More Help

1. **Check the diagnostics page** first - it will identify most issues
2. **Look at browser console** - provides detailed error messages
3. **Check GitHub Actions logs** - shows build-time errors
4. **Verify all files deployed** - dist folder should contain:
   - index.html
   - diagnostics.html  
   - test-puter.html
   - assets/ folder with JS/CSS files

## Force Rebuild and Redeploy

If nothing works:
1. Go to repository → Actions tab
2. Click on the latest workflow run
3. Click "Re-run jobs" → "Re-run all jobs"
4. Wait for completion and test again
5. Hard refresh the page: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
