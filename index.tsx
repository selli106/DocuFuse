import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Declare puter global
declare global {
  interface Window {
    puter?: any;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize the app immediately - don't wait for Puter.js
const initializeApp = () => {
  console.log('Initializing DocuFuse...');
  
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
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Initialize immediately - don't block on Puter.js
console.log('Starting DocuFuse initialization...');
initializeApp();