// addTiktokSupport.js
import { TableManager } from './tableManager.js';
import { FormManager } from './formManager.js';

const addTiktokSupport = () => {
    // Make sure required managers are available
    if (!TableManager || !FormManager) {
        console.error('Required managers not available');
        return;
    }

    // Add utility methods for TikTok detection
    TableManager.isTiktokUrl = function(url) {
        const tiktokPattern = /^https?:\/\/((?:www|vm)\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i;
        return tiktokPattern.test(url);
    };

    TableManager.getTiktokVideoId = function(url) {
        const match = url.match(/\/video\/(\d+)/i);
        return match ? match[1] : null;
    };

    // Create TikTok preview elements
    TableManager.createTiktokPreview = function(url) {
        const videoId = this.getTiktokVideoId(url);
        if (!videoId) return null;

        const container = document.createElement('div');
        container.className = 'symphytum-tiktok-preview';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 100%;
            margin-top: 8px;
        `;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.tiktok.com/embed/v2/${videoId}`;
        iframe.width = "325";
        iframe.height = "580";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = "8px";
        iframe.setAttribute('title', 'TikTok video player');

        // Add click handler for expanded view
        iframe.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showExpandedTiktok(videoId);
        });

        container.appendChild(iframe);
        return container;
    };

    TableManager.showExpandedTiktok = function(videoId) {
        const existingModal = document.querySelector('.symphytum-tiktok-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'symphytum-tiktok-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            position: relative;
            width: 90%;
            max-width: 500px;
            height: 90vh;
            max-height: 880px;
        `;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: -40px;
            right: -40px;
            background: none;
            border: none;
            color: white;
            font-size: 36px;
            cursor: pointer;
            padding: 10px;
        `;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.tiktok.com/embed/v2/${videoId}`;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        `;

        container.appendChild(closeButton);
        container.appendChild(iframe);
        modal.appendChild(container);
        document.body.appendChild(modal);

        // Add event listeners
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
            document.body.style.overflow = '';
        };

        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';

        // Add fade-in animation
        requestAnimationFrame(() => {
            modal.style.opacity = '0';
            modal.offsetHeight; // Force reflow
            modal.style.transition = 'opacity 0.3s ease-in-out';
            modal.style.opacity = '1';
        });
    };

    // Override the renderCell method in TableManager
    const originalRenderCell = TableManager.renderCell;
    TableManager.renderCell = function(td, value, type) {
        if (type === "url" && value && this.isTiktokUrl(value)) {
            const container = document.createElement("div");
            container.className = "tiktok-cell-container";
            container.appendChild(this.createTiktokPreview(value));
            td.appendChild(container);
            return td;
        }
        return originalRenderCell.call(this, td, value, type);
    };

    // Add TikTok support to FormManager
    const originalCreateInputElement = FormManager.createInputElement;
    FormManager.createInputElement = function(column, record, fontSize) {
        if (column.type === 'url' && record.data[column.id] && 
            TableManager.isTiktokUrl(record.data[column.id])) {
            const container = document.createElement('div');
            container.className = 'tiktok-input-container';
            
            // Add URL input
            const input = document.createElement('input');
            input.type = 'text';
            input.id = column.id;
            input.value = record.data[column.id];
            input.style.fontSize = `${fontSize}px`;
            container.appendChild(input);
            
            // Add preview
            const preview = TableManager.createTiktokPreview(record.data[column.id]);
            if (preview) container.appendChild(preview);
            
            return container;
        }
        return originalCreateInputElement.call(this, column, record, fontSize);
    };
};
// Import fix for TikTok embed error
if (!window.WebSocket) {
    window.WebSocket = class MockWebSocket {
        constructor() {
            setTimeout(() => {
                if (this.onerror) {
                    this.onerror();
                }
            }, 0);
        }
    };
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', addTiktokSupport);

export default addTiktokSupport;