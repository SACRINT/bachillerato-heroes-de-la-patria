/**
 * 🔔 PUSH NOTIFICATION SERVICE WORKER
 * Maneja notificaciones push en background
 * Creado: 19 Enero 2026
 */

const CACHE_NAME = 'bge-push-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW Push] Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[SW Push] Activated');
    event.waitUntil(clients.claim());
});

// Push event - Show notification
self.addEventListener('push', (event) => {
    console.log('[SW Push] Push received');

    let data = {
        title: 'BGE Héroes de la Patria',
        body: 'Tienes una nueva notificación',
        icon: '/images/logo-bachillerato-HDLP.webp',
        badge: '/images/badge-72x72.png',
        tag: 'bge-notification',
        data: {}
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        vibrate: [200, 100, 200],
        data: data.data,
        actions: data.actions || [
            { action: 'open', title: 'Ver' },
            { action: 'dismiss', title: 'Cerrar' }
        ],
        requireInteraction: data.priority === 'urgent' || data.priority === 'high'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW Push] Notification clicked:', event.action);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data || {};

    if (action === 'dismiss') {
        return;
    }

    // Determine URL to open
    let url = '/';

    if (data.action_url) {
        url = data.action_url;
    } else if (data.type) {
        // Route based on notification type
        switch (data.type) {
            case 'message':
                url = `/comunicacion-padres-docentes.html#conversation/${data.conversation_id || ''}`;
                break;
            case 'grade':
                url = '/estudiantes.html#calificaciones';
                break;
            case 'attendance':
                url = '/estudiantes.html#asistencia';
                break;
            case 'appointment':
                url = '/citas.html';
                break;
            default:
                url = '/';
        }
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('[SW Push] Notification closed');

    // Track notification dismissal if needed
    const data = event.notification.data || {};
    if (data.id) {
        // Could send analytics here
    }
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        console.log('[SW Push] Syncing messages...');
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    // Get pending messages from IndexedDB
    // and send them when back online
    try {
        const db = await openDatabase();
        const messages = await getPendingMessages(db);

        for (const message of messages) {
            try {
                const response = await fetch('/api/messaging/conversations/' + message.conversationId + '/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${message.token}`
                    },
                    body: JSON.stringify(message.data)
                });

                if (response.ok) {
                    await deletePendingMessage(db, message.id);
                }
            } catch (e) {
                console.error('[SW Push] Sync failed for message:', e);
            }
        }
    } catch (e) {
        console.error('[SW Push] Background sync error:', e);
    }
}

// IndexedDB helpers
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BGE_PushDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingMessages')) {
                db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getPendingMessages(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('pendingMessages', 'readonly');
        const store = tx.objectStore('pendingMessages');
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function deletePendingMessage(db, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('pendingMessages', 'readwrite');
        const store = tx.objectStore('pendingMessages');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

console.log('[SW Push] Service Worker loaded');
