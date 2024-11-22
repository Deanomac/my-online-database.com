// notifications.js
export const Notifications = {
  initialized: false, // Track initialization

  init() {
    if (this.initialized) return; // Prevent multiple initializations
    this.initialized = true;

    const container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            color:white;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
    document.body.appendChild(container);

    const style = document.createElement("style");
    style.textContent = `
            .notification {
                padding: 16px 24px;
                border-radius: 16px;
                color: white;
                font-weight: bold;
                font-size: 24px; /* Set font size to 48px */
                min-width: 100px;

                max-width: 250px;
                position: relative;
                animation: slideIn 0.3s ease-out;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }

            .notification.success {
                background: linear-gradient(98deg, rgba(18,130,242,1) 0%, rgba(43,73,255,1) 100%);
                color: white; 
            }

            .notification.error {
                background: linear-gradient(77deg, rgba(255,43,173,1) 0%, rgba(242,18,18,1) 100%);
                color: white; /* Ensure text color is white */
            }

            .notification.warning {
                background: var(--warning-color, #f59e0b);
            }

            .notification.info {
                background: #3b82f6;
                 color: white;
            }

            .notification .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px; /* Adjusted for better visibility with larger font */
                cursor: pointer;
                padding: 0 0 0 16px;
                opacity: 0.8;
            }

            .notification .close-btn:hover {
                opacity: 1;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(style);
  },

  show(message, type = "info", duration = 2000) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");

    const messageText = document.createElement("span");
    messageText.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "×";
    closeBtn.setAttribute("aria-label", "Close notification");
    closeBtn.onclick = () => this.dismiss(notification);

    notification.append(messageText, closeBtn);
    container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => this.dismiss(notification), duration);
    }

    return notification;
  },

  dismiss(notification) {
    notification.style.animation = "slideOut 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  },

  success(message, duration = 1000) {
    return this.show(message, "success", duration);
  },

  error(message, duration = 3000) {
    return this.show(message, "error", duration);
  },

  warning(message, duration = 3000) {
    return this.show(message, "warning", duration);
  },

  info(message, duration = 2000) {
    return this.show(message, "info", duration);
  },
};
