<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1d-HDFerVG2e0gCkkuR7SMcIqAbb5H9ww

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

This repository is configured for automatic deployment to GitHub Pages.

### Setup

1. Go to your repository settings on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**, set **Source** to "GitHub Actions"
4. Push changes to the `main` branch to trigger the deployment

The app will be deployed automatically to `https://<username>.github.io/DocuFuse/`

### Troubleshooting

If your GitHub Pages shows a blank page:

1. **Check Diagnostics**: Visit `https://<username>.github.io/DocuFuse/diagnostics.html`
   - This page will show if Puter.js is loaded, if modules are working, and identify common issues
   
2. **Test Puter.js**: Visit `https://<username>.github.io/DocuFuse/test-puter.html`
   - Simple test to verify Puter.js AI integration is working

3. **Check Browser Console**: Press F12 and look for errors in the Console tab

4. **Verify Build Success**: Check the Actions tab in GitHub to ensure the workflow completed successfully

For detailed troubleshooting steps, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
