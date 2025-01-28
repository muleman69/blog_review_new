/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, Route } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

clientsClaim();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache page navigations (HTML)
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(new RegExp('/[^/?]+\\.[^/]+$'))) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache CSS, JS, and Web Worker files with a Stale While Revalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache images with a Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache API responses with Network First strategy
registerRoute(
  new Route(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
      cacheName: 'api-responses',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 10 * 60, // 10 minutes
        }),
      ],
    })
  )
);

// Cache documentation responses
registerRoute(
  new Route(
    ({ url }) => url.pathname.includes('/documentation/'),
    new StaleWhileRevalidate({
      cacheName: 'documentation-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        }),
      ],
    })
  )
);

interface ValidationRequest {
  data: any;
  resolver: (value: any) => void;
  reject: (reason?: any) => void;
}

// Handle validation rule requests with batching
const validationQueue: ValidationRequest[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

const processBatch = async () => {
  if (validationQueue.length === 0) return;

  const batch = validationQueue.splice(0);
  try {
    const response = await fetch('/api/validation/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: batch.map(req => req.data) }),
    });
    
    if (response.ok) {
      const results = await response.json();
      // Respond to each request in the batch
      batch.forEach((request, index) => {
        request.resolver(results[index]);
      });
    }
  } catch (error) {
    batch.forEach(request => {
      request.reject(error);
    });
  }
};

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'VALIDATION_REQUEST') {
    const promise = new Promise((resolve, reject) => {
      validationQueue.push({
        data: event.data.payload,
        resolver: resolve,
        reject,
      });
    });

    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        batchTimeout = null;
        void processBatch();
      }, 100); // Batch requests every 100ms
    }

    event.waitUntil(promise);
  }
}); 