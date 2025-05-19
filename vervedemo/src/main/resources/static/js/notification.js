/**
 * NotificationHandler - Manages notification functionality
 * Implements Observer pattern on the frontend
 */
class NotificationHandler {
    constructor() {
        this.notifications = [];
        this.callbacks = [];
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds
        this.pingInterval = null;
        // Don't call init in constructor - will be called manually after DOM is ready
    }
    
    /**
     * Initialize the notification handler
     */
    init() {
        // Add notification elements to the DOM
        this.addNotificationElements();
        
        // Add event listeners
        document.getElementById('notification-icon').addEventListener('click', () => {
            this.toggleNotificationPanel();
        });
        
        document.getElementById('mark-all-read').addEventListener('click', (e) => {
            e.stopPropagation();
            this.markAllAsRead();
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const notificationIcon = document.getElementById('notification-icon');
            const notificationPanel = document.getElementById('notification-panel');
            
            if (!notificationIcon.contains(e.target) && !notificationPanel.contains(e.target)) {
                notificationPanel.classList.remove('show');
            }
        });
        
        // Initial fetch of notifications - if user is already logged in
        this.fetchNotifications();
    }
    
    /**
     * Connect to Server-Sent Events for real-time notifications
     */
    connectSSE() {
        // Get current user from local storage if not available globally
        const user = this.getCurrentUser();
        
        if (!user || !user.id) {
            console.error('Cannot connect to SSE: No user ID available');
            return;
        }
        
        // Close existing connection if any
        this.disconnectSSE();
        
        try {
            // Create new SSE connection
            console.log('Connecting to SSE stream for user ID:', user.id);
            this.eventSource = new EventSource(`/api/notifications/stream?userId=${user.id}`);
            
            // Handle incoming notifications
            this.eventSource.addEventListener('notification', (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    // Only process notifications meant for the current user
                    if (notification.userId === user.id) {
                        this.notifications.unshift(notification);
                        this.notifyCallbacks();
                        this.updateNotificationUI();
                    }
                } catch (error) {
                    console.error('Error processing notification event:', error);
                }
            });
            
            // Handle connection open
            this.eventSource.addEventListener('open', () => {
                console.log('SSE connection established');
                // Reset reconnect attempts on successful connection
                this.reconnectAttempts = 0;
                this.reconnectDelay = 2000;
            });
            
            // Handle errors
            this.eventSource.addEventListener('error', (e) => {
                console.error('SSE connection error:', e);
                
                if (this.eventSource.readyState === EventSource.CLOSED) {
                    this.reconnectSSE();
                }
            });
            
            // Add a ping/pong mechanism to keep connection alive
            this.pingInterval = setInterval(() => {
                // Just check if connection is still open
                if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
                    console.log('SSE connection is alive');
                } else if (this.eventSource) {
                    console.log('SSE connection lost. Reconnecting...');
                    this.reconnectSSE();
                }
            }, 30000); // Check every 30 seconds
            
        } catch (error) {
            console.error('Error setting up SSE connection:', error);
            this.reconnectSSE();
        }
    }
    
    /**
     * Get current user - checks both global variable and localStorage
     */
    getCurrentUser() {
        // First check global variable if it exists
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
            return currentUser;
        }
        
        // Otherwise try to get from localStorage
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                return JSON.parse(savedUser);
            }
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
        }
        
        return null;
    }
    
    /**
     * Handle reconnection with exponential backoff
     */
    reconnectSSE() {
        this.disconnectSSE();
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(30000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
            console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connectSSE();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page to restore real-time notifications.');
        }
    }
    
    /**
     * Disconnect SSE connection
     */
    disconnectSSE() {
        if (this.eventSource) {
            console.log('Closing SSE connection');
            this.eventSource.close();
            this.eventSource = null;
        }
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    /**
     * Add notification elements to the navigation bar
     */
    addNotificationElements() {
        // Find all nav-right-items divs
        const rightNavs = document.querySelectorAll('.nav-right-items');
        
        if (rightNavs.length > 0) {
            rightNavs.forEach(rightNav => {
                // Create notification list item
                const notificationLi = document.createElement('li');
                notificationLi.innerHTML = `
                    <div id="notification-icon" class="notification-icon">
                        <i class="fas fa-bell"></i>
                        <span id="notification-badge" class="notification-badge"></span>
                    </div>
                    <div id="notification-panel" class="notification-panel">
                        <div class="notification-header">
                            <h3 class="notification-title">Notifications</h3>
                            <span id="mark-all-read" class="mark-all-read">Mark all as read</span>
                        </div>
                        <div id="notifications-container"></div>
                    </div>
                `;
                
                // Insert before logout
                const logoutLi = rightNav.querySelector('li');
                if (logoutLi) {
                    rightNav.insertBefore(notificationLi, logoutLi);
                } else {
                    rightNav.appendChild(notificationLi);
                }
            });
            
            // We need to ensure only one notification panel is active
            // (since we're adding one to each nav-right-items)
            const notificationIcons = document.querySelectorAll('#notification-icon');
            const notificationPanels = document.querySelectorAll('#notification-panel');
            
            if (notificationIcons.length > 1) {
                // Keep first one as main, make others reference it
                const mainIcon = notificationIcons[0];
                const mainPanel = notificationPanels[0];
                
                // For all other notification icons
                for (let i = 1; i < notificationIcons.length; i++) {
                    notificationIcons[i].addEventListener('click', () => {
                        mainPanel.classList.toggle('show');
                    });
                    
                    // Hide duplicate panels to avoid conflicts
                    notificationPanels[i].style.display = 'none';
                }
            }
        }
    }
    
    /**
     * Register a callback to be called when notifications change
     */
    registerCallback(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
    }
    
    /**
     * Fetch notifications from the server
     */
    fetchNotifications() {
        const user = this.getCurrentUser();
        
        if (!user) {
            console.warn('Cannot fetch notifications: No user is logged in');
            return;
        }
        
        console.log('Fetching notifications for user:', user.id);
        
        fetch('/api/notifications', {
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache'
            }
        })
        .then(response => {
            console.log('Notifications response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch notifications: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received notifications:', data.length, data);
            this.notifications = data;
            this.notifyCallbacks();
            this.updateNotificationUI();
        })
        .catch(error => {
            console.error('Error fetching notifications:', error);
            // Don't use debug endpoint in production - just show empty state
            this.notifications = [];
            this.updateNotificationUI();
        });
    }
    
    /**
     * Toggle the notification panel visibility
     */
    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        panel.classList.toggle('show');
    }
    
    /**
     * Update the notification UI
     */
    updateNotificationUI() {
        const badge = document.getElementById('notification-badge');
        const container = document.getElementById('notifications-container');
        
        // Update badge
        const unreadCount = this.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount > 0 ? unreadCount : '';
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
        
        // Update notification list
        container.innerHTML = '';
        
        if (this.notifications.length === 0) {
            container.innerHTML = '<div class="notification-empty">No notifications</div>';
            return;
        }
        
        this.notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification ${notification.read ? 'read' : 'unread'}`;
            
            // Create content based on notification type
            let notificationContent = this.createNotificationContent(notification);
            
            notificationElement.innerHTML = `
                ${notificationContent}
                <span class="notification-date">${formatDate(new Date(notification.createdAt))}</span>
            `;
            
            // Add mark as read functionality
            if (!notification.read) {
                notificationElement.addEventListener('click', () => {
                    this.markAsRead(notification.id);
                });
            }
            
            container.appendChild(notificationElement);
        });
    }
    
    /**
     * Create notification content based on type
     */
    createNotificationContent(notification) {
        let content = `<p>${notification.message}</p>`;
        
        // Add click action for resource if applicable
        if (notification.resourceId && notification.type) {
            let resourceLink = '';
            
            switch(notification.type) {
                case 'NEW_COMMENT':
                case 'COMMENT_REPLY':
                    // Add link to article with comment
                    resourceLink = `onclick="showArticleDetails(${notification.resourceId})"`;
                    break;
                case 'NEW_ARTICLE':
                    // Add link to article
                    resourceLink = `onclick="showArticleDetails(${notification.resourceId})"`;
                    break;
                // Add more types as needed
            }
            
            if (resourceLink) {
                content = `<p class="clickable" ${resourceLink}>${notification.message}</p>`;
            }
        }
        
        return content;
    }
    
    /**
     * Mark a notification as read
     */
    markAsRead(notificationId) {
        const user = this.getCurrentUser();
        
        if (!user) {
            console.warn('Cannot mark notification as read: No user is logged in');
            return;
        }
        
        fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to mark notification as read: ${response.status}`);
            }
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.notifyCallbacks();
                this.updateNotificationUI();
            }
        })
        .catch(error => {
            console.error('Error marking notification as read:', error);
        });
    }
    
    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        const user = this.getCurrentUser();
        
        if (!user || this.notifications.length === 0) {
            return;
        }
        
        fetch('/api/notifications/read-all', {
            method: 'PUT',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to mark all notifications as read: ${response.status}`);
            }
            
            // Update local state
            this.notifications.forEach(notification => {
                notification.read = true;
            });
            
            this.notifyCallbacks();
            this.updateNotificationUI();
        })
        .catch(error => {
            console.error('Error marking all notifications as read:', error);
        });
    }
    
    /**
     * Notify registered callbacks
     */
    notifyCallbacks() {
        if (this.callbacks && this.callbacks.length > 0) {
            this.callbacks.forEach(callback => {
                try {
                    callback(this.notifications);
                } catch (error) {
                    console.error('Error in notification callback:', error);
                }
            });
        }
    }
}

/**
 * Format date for notification display
 */
function formatDate(date) {
    const now = new Date();
    const diff = Math.abs(now - date) / 1000; // diff in seconds
    
    if (diff < 60) {
        return 'Just now';
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * Create a global notification handler instance
 */
const notificationHandler = new NotificationHandler();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to ensure DOM is fully loaded and user data is available
    setTimeout(() => {
        notificationHandler.init();
    }, 500);
});

/**
 * Proper implementation of frontend observer for notifications
 */
class UserNotificationObserverFrontend {
    constructor() {
        // Register with notification handler
        notificationHandler.registerCallback(this.update.bind(this));
    }
    
    setUserId(userId) {
        this.userId = userId;
        console.log('Set notification observer user ID:', userId);
    }
    
    getUserId() {
        return this.userId;
    }
    
    /**
     * Handle update notifications
     */
    update(notifications) {
        // Filter notifications for this user
        const userNotifications = notifications.filter(n => n.userId === this.userId);
        
        // Implement custom handling logic here
        // For example, display toasts for new unread notifications
        const newUnread = userNotifications.filter(n => !n.read);
        if (newUnread.length > 0) {
            // Display toast or other UI notification
            this.showToast(`You have ${newUnread.length} new notification${newUnread.length > 1 ? 's' : ''}`);
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(message) {
        // Check if toast container exists, if not create it
        let toastContainer = document.getElementById('notification-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'notification-toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `<p>${message}</p>`;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show after a small delay (for animation)
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300); // Wait for fade out animation
        }, 5000);
    }
} 