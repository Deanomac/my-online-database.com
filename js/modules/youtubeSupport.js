// youtubeSupport.js
import { TableManager } from './tableManager.js';
import { FormManager } from './formManager.js';

const addYouTubeSupport = () => {
    // Ensure required managers are available
    if (!TableManager || !FormManager) {
        console.error('Required managers not available for YouTube support');
        return;
    }

    // Add utility methods to both managers
    [TableManager, FormManager].forEach(manager => {
        // YouTube URL detection
        manager.isYouTubeUrl = function(url) {
            const youTubePattern = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            return youTubePattern.test(url);
        };

        // Extract video ID
        manager.getYouTubeVideoId = function(url) {
            const match = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        };

        // Create preview container
        manager.createYouTubePreview = function(url, { isTable = false } = {}) {
            const videoId = this.getYouTubeVideoId(url);
            if (!videoId) return null;

            const container = document.createElement('div');
            container.className = 'symphytum-youtube-preview';
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                width: 100%;
                margin-top: 8px;
            `;

            const iframe = document.createElement('iframe');
            iframe.dataset.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.width = isTable ? "200" : "100%";
            iframe.height = isTable ? "113" : "315"; // Different heights for table/form
            iframe.frameBorder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.style.borderRadius = "8px";
            iframe.setAttribute('title', 'YouTube video player');
            iframe.setAttribute('aria-label', 'YouTube video player');
            iframe.setAttribute('tabindex', '0');

            // Add click handler for expanded view
            iframe.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExpandedYouTube(videoId);
            });

            // Keyboard accessibility
            iframe.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showExpandedYouTube(videoId);
                }
            });

            // Error handling
            iframe.addEventListener('error', () => {
                const errorMsg = document.createElement('p');
                errorMsg.textContent = 'Unable to load YouTube video';
                errorMsg.style.color = 'red';
                errorMsg.style.fontSize = '12px';
                container.innerHTML = '';
                container.appendChild(errorMsg);
            });

            // Lazy loading
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.src = entry.target.dataset.src;
                        obs.unobserve(entry.target);
                    }
                });
            });

            observer.observe(iframe);
            container.appendChild(iframe);

            // Add URL text if in table view
            if (isTable) {
                const urlText = document.createElement('div');
                urlText.className = 'symphytum-url-text';
                urlText.textContent = url;
                urlText.style.cssText = `
                    margin-top: 4px;
                    font-size: 12px;
                    word-break: break-all;
                `;
                container.appendChild(urlText);
            }

            return container;
        };

        // Show expanded video
        manager.showExpandedYouTube = function(videoId) {
            const existingModal = document.querySelector('.symphytum-youtube-modal');
            if (existingModal) {
                existingModal.remove();
            }

            const modal = document.createElement('div');
            modal.className = 'symphytum-youtube-modal';
            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.9)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '9999',
                opacity: '0',
                transition: 'opacity 0.3s ease-in-out'
            });

            const container = document.createElement('div');
            container.style.cssText = `
                position: relative;
                width: 90%;
                max-width: 1280px;
                aspect-ratio: 16/9;
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
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.style.borderRadius = '8px';
            iframe.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';

            container.appendChild(closeButton);
            container.appendChild(iframe);
            modal.appendChild(container);
            document.body.appendChild(modal);

            // Event handlers
            const closeModal = () => {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
                document.body.style.overflow = '';
            };

            closeButton.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeModal();
            }, { once: true });

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';

            // Fade in
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
            });
        };
    });

    // Override TableManager.renderCell
    const originalRenderCell = TableManager.renderCell;
    TableManager.renderCell = function(td, value, type) {
        if (type === 'url' && value && this.isYouTubeUrl(value)) {
            const container = document.createElement('div');
            container.className = 'symphytum-url-container';
            container.appendChild(this.createYouTubePreview(value, { isTable: true }));
            td.appendChild(container);
            return td;
        }
        return originalRenderCell.call(this, td, value, type);
    };

    // Override FormManager.createInputElement
    const originalCreateInputElement = FormManager.createInputElement;
    FormManager.createInputElement = function(column, record, fontSize) {
        if (column.type === 'url' && record.data[column.id] && this.isYouTubeUrl(record.data[column.id])) {
            const container = document.createElement('div');
            container.className = 'youtube-input-container';
            
            // Add URL input
            const input = document.createElement('input');
            input.type = 'text';
            input.id = column.id;
            input.value = record.data[column.id];
            input.style.fontSize = `${fontSize}px`;
            container.appendChild(input);
            
            // Add preview
            const preview = this.createYouTubePreview(record.data[column.id], { isTable: false });
            if (preview) container.appendChild(preview);

            // Update preview on input
            input.addEventListener('input', (e) => {
                const existingPreview = container.querySelector('.symphytum-youtube-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                if (this.isYouTubeUrl(e.target.value)) {
                    const newPreview = this.createYouTubePreview(e.target.value, { isTable: false });
                    if (newPreview) container.appendChild(newPreview);
                }
            });
            
            return container;
        }
        return originalCreateInputElement.call(this, column, record, fontSize);
    };
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', addYouTubeSupport);

export default addYouTubeSupport;