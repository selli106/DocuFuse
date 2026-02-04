import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';

// Declare puter global
declare global {
  interface Window {
    puter?: any;
  }
}

console.log('📦 index.tsx loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('✓ Root element found');

// Initialize the app immediately - don't wait for Puter.js
const initializeApp = () => {
  console.log('🚀 Initializing DocuFuse...');
  
  try {
    // Check if Puter.js is available (but don't wait for it)
    if (typeof window.puter !== 'undefined') {
      console.log('✓ Puter.js loaded successfully');
    } else {
      console.warn('⚠ Puter.js not loaded - PDF/Image processing may not work. Will retry...');
      
      // Try to detect Puter.js loading asynchronously
      let retries = 0;
      const checkPuter = setInterval(() => {
        retries++;
        if (typeof window.puter !== 'undefined') {
          console.log('✓ Puter.js loaded on retry ' + retries);
          clearInterval(checkPuter);
        } else if (retries > 20) {
          // Stop checking after 20 retries (10 seconds)
          clearInterval(checkPuter);
          console.warn('⚠ Puter.js loading failed - AI features will be disabled');
        }
      }, 500);
    }

    const root = ReactDOM.createRoot(rootElement);
    console.log('🎨 Rendering React app...');
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✓ React app rendered successfully');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; gap: 1rem; color: #ef4444;">
        <div style="font-size: 2rem;">❌</div>
        <div>Error loading DocuFuse</div>
        <div style="font-size: 0.875rem; color: #94a3b8;">Check browser console for details</div>
      </div>
    `;
  }
};

// Initialize immediately - don't block on Puter.js
console.log('⏱️ Starting DocuFuse initialization...');
initializeApp();