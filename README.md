<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# DocuFuse

**A powerful document combiner powered by Gemini AI**

[![Live App](https://img.shields.io/badge/Live%20App-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://selli106.github.io/DocuFuse/)

</div>

## Overview

DocuFuse merges PDF, HTML, JS, RTF, and TXT files into a single unified format using Gemini AI for intelligent text extraction and combination. Upload multiple documents and let AI handle the heavy lifting.

## 🚀 Live Demo

Try DocuFuse directly in your browser — no installation required:

**[https://selli106.github.io/DocuFuse/](https://selli106.github.io/DocuFuse/)**

## Features

- 📄 Supports PDF, HTML, JS, RTF, and TXT file formats
- 🤖 Gemini AI-powered intelligent text extraction
- 🔀 Merges multiple documents into one unified output
- ⚡ Fast, client-side processing

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

## Deployment

This repository is configured for automatic deployment to GitHub Pages via GitHub Actions. Every push to the `main` branch triggers a new deployment to **[https://selli106.github.io/DocuFuse/](https://selli106.github.io/DocuFuse/)**.

### First-time Setup

1. Go to your repository **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` — the workflow handles the rest

## Troubleshooting

If the deployed app shows a blank page:

1. **Run Diagnostics** — visit [`/diagnostics.html`](https://selli106.github.io/DocuFuse/diagnostics.html) to check if Puter.js is loaded and modules are working
2. **Test Puter.js** — visit [`/test-puter.html`](https://selli106.github.io/DocuFuse/test-puter.html) to verify AI integration
3. **Browser Console** — press F12 and check the Console tab for errors
4. **Workflow Logs** — check the **Actions** tab in GitHub to confirm the build succeeded

For detailed steps see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
