// Environment-specific configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = `${API_URL}/api`;

// Feature flags
export const FEATURES = {
    enableAiSuggestions: process.env.VITE_ENABLE_AI_SUGGESTIONS === 'true',
    enableRealTimeValidation: process.env.VITE_ENABLE_REAL_TIME_VALIDATION === 'true',
    enableAnalytics: process.env.VITE_ENABLE_ANALYTICS === 'true',
    debugMode: process.env.NODE_ENV === 'development'
};

// API endpoints
export const ENDPOINTS = {
    blogPosts: '/blog-posts',
    health: '/health',
    debug: '/debug'
};

// Cache configuration
export const CACHE_CONFIG = {
    ttl: parseInt(process.env.VITE_CACHE_TTL || '300', 10) * 1000, // Convert to milliseconds
    maxSize: parseInt(process.env.VITE_MAX_CACHE_SIZE || '100', 10)
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
    validationBatchSize: parseInt(process.env.VITE_VALIDATION_BATCH_SIZE || '5', 10),
    validationDebounceMs: parseInt(process.env.VITE_VALIDATION_DEBOUNCE_MS || '1000', 10)
};

// Analytics configuration
export const ANALYTICS_CONFIG = {
    enabled: FEATURES.enableAnalytics,
    analyticsId: process.env.VITE_ANALYTICS_ID
};

// UI configuration
export const UI_CONFIG = {
    theme: {
        primary: '#3b82f6',
        secondary: '#9ca3af',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
    },
    animation: {
        duration: '0.2s',
        timing: 'ease-in-out'
    }
};

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
    console.log('Frontend configuration:', {
        apiBaseUrl: API_BASE_URL,
        features: FEATURES,
        cache: CACHE_CONFIG,
        performance: PERFORMANCE_CONFIG,
        analytics: {
            enabled: ANALYTICS_CONFIG.enabled,
            analyticsId: ANALYTICS_CONFIG.analyticsId ? 'Set' : 'Not set'
        },
        environment: process.env.NODE_ENV
    });
} 