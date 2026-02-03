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

// Function to initialize the app
const initializeApp = () => {
  console.log('Initializing DocuFuse...');
  
  // Check if Puter.js is available
  if (typeof window.puter === 'undefined') {
    console.warn('Puter.js not detected - AI features may not work properly');
  } else {
    console.log('Puter.js loaded successfully');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Wait for Puter.js to load if not already available
if (typeof window.puter !== 'undefined') {
  // Puter.js already loaded
  initializeApp();
} else {
  // Wait a bit for Puter.js to load
  console.log('Waiting for Puter.js to load...');
  setTimeout(() => {
    initializeApp();
  }, 500);
}