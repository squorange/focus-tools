// Focus Tools Service Worker
// IMPORTANT: Increment this version when deploying significant changes
// to force old cached content to be invalidated
const CACHE_NAME = 'focus-tools-v6';
const SCHEDULED_REMINDERS_KEY = 'task-copilot-scheduled-reminders';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and check reminders
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Check for pending reminders
      checkPendingReminders(),
    ])
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests (always go to network)
  if (event.request.url.includes('/api/')) return;

  // For navigation requests (HTML pages), always try network first and don't cache
  // This ensures users always get the latest HTML which references correct JS bundles
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only fall back to cached root page if truly offline
          return caches.match('/');
        })
    );
    return;
  }

  // For other assets (JS, CSS, images), use network-first with caching
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();

        // Cache successful responses for static assets only
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle notification clicks - deep link to task
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const taskId = event.notification.tag;
  const urlToOpen = taskId ? `/?task=${taskId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope)) {
            // Focus existing window and navigate
            return client.focus().then(() => {
              client.navigate(urlToOpen);
            });
          }
        }
        // No window open, open a new one
        return clients.openWindow(urlToOpen);
      })
  );
});

// Check for pending reminders that may have been scheduled while app was closed
async function checkPendingReminders() {
  // Service workers don't have direct access to localStorage
  // The app itself handles checking reminders on load via initializeReminders()
  // This function is a placeholder for future enhancements like
  // IndexedDB-based reminder storage that service workers can access
  console.log('[SW] Service worker activated, app will check reminders on load');
}

// Handle messages from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    console.log('[SW] Received check reminders message');
    // Could trigger reminder check here if using IndexedDB
  }
});
