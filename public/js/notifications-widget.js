// Notification Widget Logic

const NotificationWidget = {
    init: function (containerId) {
        // Inject HTML
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="notif-wrapper">
                <button class="notif-btn" id="notif-toggle" onclick="NotificationWidget.toggleDropdown()">
                    <i class="fas fa-bell"></i>
                    <span class="notif-badge d-none" id="notif-count">0</span>
                </button>
                <div class="notif-dropdown" id="notif-dropdown">
                    <div class="notif-header">
                        <h6 class="notif-title">Notificaciones</h6>
                        <a href="#" class="notif-actions text-decoration-none" onclick="NotificationWidget.markAllRead(); return false;">Marcar leídas</a>
                    </div>
                    <div class="notif-list" id="notif-list">
                        <div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>
                    </div>
                </div>
            </div>
        `;

        // Load specific CSS if not already present
        if (!document.querySelector('link[href="css/notifications.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/notifications.css';
            document.head.appendChild(link);
        }

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notif-wrapper')) {
                document.getElementById('notif-dropdown').classList.remove('show');
            }
        });

        // Initial fetch
        this.fetchNotifications();

        // Poll every 60s
        setInterval(() => this.fetchNotifications(), 60000);
    },

    toggleDropdown: function () {
        const dd = document.getElementById('notif-dropdown');
        dd.classList.toggle('show');
    },

    fetchNotifications: async function () {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.success && json.data) {
                this.render(json.data.items, json.data.unreadCount);
            }
        } catch (e) {
            console.error('Error fetching notifications:', e);
        }
    },

    render: function (items, unreadCount) {
        // Update Badge
        const badge = document.getElementById('notif-count');
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }

        // Render List
        const list = document.getElementById('notif-list');

        if (items.length === 0) {
            list.innerHTML = '<div class="empty-state">No tienes notificaciones.</div>';
            return;
        }

        list.innerHTML = items.map(item => `
            <a href="${item.reference_url || '#'}" class="notif-item ${item.is_read ? '' : 'unread'}" onclick="NotificationWidget.markRead(${item.id})">
                <div class="notif-icon">
                    ${this.getIcon(item.type)}
                </div>
                <div class="notif-content">
                    <div class="notif-text fw-bold small">${item.title}</div>
                    <div class="notif-text text-muted small">${item.message}</div>
                    <div class="notif-time">${new Date(item.created_at).toLocaleString()}</div>
                </div>
            </a>
        `).join('');
    },

    getIcon: function (type) {
        const icons = {
            'friend_request': '<i class="fas fa-user-plus text-primary"></i>',
            'team_invite': '<i class="fas fa-shield-alt text-warning"></i>',
            'mentorship_request': '<i class="fas fa-chalkboard-teacher text-success"></i>',
            'system': '<i class="fas fa-info-circle text-info"></i>',
            'default': '<i class="fas fa-bell"></i>'
        };
        return icons[type] || icons['default'];
    },

    markRead: async function (id) {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.fetchNotifications(); // Refresh
        } catch (e) { console.error(e); }
    },

    markAllRead: async function () {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications/read-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.fetchNotifications(); // Refresh
        } catch (e) { console.error(e); }
    }
};

// Auto-init if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('notification-widget-container')) {
        NotificationWidget.init('notification-widget-container');
    }
});
