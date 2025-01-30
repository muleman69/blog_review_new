import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './router';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/common/ErrorBoundary';
import { debugLogger } from './utils/debug';

// Initialize app with environment info
debugLogger.info('App', 'Initializing application', {
  environment: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL,
  buildTime: import.meta.env.BUILD_TIME,
  version: import.meta.env.VERSION
});

// Add global error boundary
window.onerror = (message, source, lineno, colno, error) => {
  debugLogger.error('Window', 'Global error caught', {
    message,
    source,
    lineno,
    colno,
    error
  });
};

// Get API URL from environment
const apiUrl = import.meta.env.VITE_API_URL;
debugLogger.info('Config', 'API configuration', { apiUrl });

// Health check with detailed logging
const checkHealth = async () => {
  const { requestId, logResponse, logError } = debugLogger.logRequest('GET', `${apiUrl}/health`);
  
  try {
    debugLogger.debug('Health', 'Starting health check');
    const response = await fetch(`${apiUrl}/health`);
    logResponse(response);
    
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    debugLogger.info('Health', 'Health check successful', data);
    
    // Verify critical services
    if (data.services) {
      Object.entries(data.services).forEach(([service, status]) => {
        debugLogger.debug('Health', `Service status: ${service}`, status);
      });
    }
  } catch (error) {
    logError(error);
    debugLogger.error('Health', 'Health check failed', error);
  }
};

// Add performance monitoring
const reportWebVitalsToDebug = (metric: any) => {
  debugLogger.debug('Performance', metric.name, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta
  });
};

// Create debug UI (only in development)
if (import.meta.env.DEV) {
  const debugButton = document.createElement('button');
  debugButton.innerHTML = 'Show Debug Logs';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '20px';
  debugButton.style.right = '20px';
  debugButton.style.zIndex = '9999';
  
  debugButton.onclick = () => {
    console.log('Debug Logs:', debugLogger.exportLogs());
  };
  
  document.body.appendChild(debugButton);
}

// Run initial checks
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

reportWebVitals(reportWebVitalsToDebug);
