// videoSupport.js
import { TableManager } from './tableManager.js';
import { FormManager } from './formManager.js';

const addVideoSupport = () => {
    // Make sure required managers are available
    if (!TableManager || !FormManager) {
        console.error('Required managers not available');
        return;
    }

    // Add utility methods for video detection
    TableManager.isMP4Url = function(url) {
        const videoExtensions = /\.(mp4)$/i;
        const imgurVideoPattern = /imgur\.com\/[a-zA-Z0-9]+\.mp4$/i;
        return videoExtensions.test(url) && (imgurVideoPattern.test(url) || url.includes('http'));
    };

    // Create video preview elements
    TableManager.createMP4Preview = function(url) {
        const container = document.createElement('div');
        container.className = 'symphytum-video-preview';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 100%;
            margin-top: 8px;
        `;

        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.style.cssText = `
            width: 100%;
            max-width: 400px;
            border-radius: 8px;
            cursor: pointer;
        `;
        video.setAttribute('aria-label', 'Video preview');

        // Add click handler for expanded view
        video.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showExpandedVideo(url);
        });

        container.appendChild(video);
        return container;
    };

    // Override the renderCell method in TableManager
    const originalRenderCell = TableManager.renderCell;
    TableManager.renderCell = function(td, value, type) {
        if (type === "url" && value && this.isMP4Url(value)) {
            const container = document.createElement("div");
            container.className = "video-cell-container";
            container.appendChild(this.createMP4Preview(value));
            td.appendChild(container);
            return td;
        }
        return originalRenderCell.call(this, td, value, type);
    };

    // Add MP4 support to FormManager
    const originalCreateInputElement = FormManager.createInputElement;
    FormManager.createInputElement = function(column, record, fontSize) {
        if (column.type === 'url' && record.data[column.id] && 
            TableManager.isMP4Url(record.data[column.id])) {
            const container = document.createElement('div');
            container.className = 'video-input-container';
            
            // Add URL input
            const input = document.createElement('input');
            input.type = 'text';
            input.id = column.id;
            input.value = record.data[column.id];
            input.style.fontSize = `${fontSize}px`;
            container.appendChild(input);
            
            // Add preview
            const preview = TableManager.createMP4Preview(record.data[column.id]);
            if (preview) container.appendChild(preview);
            
            return container;
        }
        return originalCreateInputElement.call(this, column, record, fontSize);
    };
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', addVideoSupport);

export default addVideoSupport;