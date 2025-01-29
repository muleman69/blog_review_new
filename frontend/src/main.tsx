import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './router';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/common/ErrorBoundary';

// Debug logging
const debug = {
  log: (component: string, message: string, data?: any) => {
    console.log(`[${component}] ${message}`, data || '');
  },
  error: (component: string, message: string, error?: any) => {
    console.error(`[${component}] ${message}`, error || '');
  }
};

// Add global error boundary
window.onerror = (message, source, lineno, colno, error) => {
  debug.error('window', 'Global error:', { message, source, lineno, colno, error });
};

// Get API URL from environment or default to relative path
const apiUrl = process.env.VITE_API_URL || '/api';
debug.log('config', 'Using API URL:', apiUrl);

// Health check on startup with better error handling
const checkHealth = async () => {
  try {
    const response = await fetch(`${apiUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    const data = await response.json();
    debug.log('health', 'Backend health check:', data);
  } catch (error) {
    debug.error('health', 'Backend health check failed:', error);
    // Don't throw here, just log the error
  }
};

// Run health check
checkHealth();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
