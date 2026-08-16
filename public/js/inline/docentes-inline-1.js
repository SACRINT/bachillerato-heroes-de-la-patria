// Initialize Teachers Portal on page load
        document.addEventListener('DOMContentLoaded', () => {
            window.teachersPortal = new TeachersPortalManager({
                apiBaseURL: '/api/teachers-portal'
            });

            // Initialize Real-time Chat
            window.chatClient = new RealtimeChatClient({
                autoConnect: true,
                role: 'docente'
            });

            // Initialize Push Notifications UI
            const pushToggle = new PushNotificationToggle('push-toggle-container'); // Add this container in UI settings later
        });
