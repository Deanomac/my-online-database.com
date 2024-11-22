// formViewVideoSupport.js
import { FormManager } from './formManager.js';

const addVideoSupport = () => {
    // Ensure FormManager is available
    if (!FormManager || typeof FormManager !== 'object') {
        console.error('FormManager is not available for mutation.');
        return;
    }

    // Add utility methods for video detection
    FormManager.isYouTubeUrl = function(url) {
        const youTubePattern = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return youTubePattern.test(url);
    };

    FormManager.getYouTubeVideoId = function(url) {
        const match = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    };

    FormManager.isMP4Url = function(url) {
        const videoExtensions = /\.(mp4)$/i;
        const imgurVideoPattern = /imgur\.com\/[a-zA-Z0-9]+\.mp4$/i;
        return videoExtensions.test(url) && (imgurVideoPattern.test(url) || url.includes('http'));
    };

    // Create video preview elements
    FormManager.createMP4Preview = function(url) {
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

    FormManager.createYouTubePreview = function(url) {
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
        iframe.width = "100%";
        iframe.style.maxWidth = "400px";
        iframe.height = "225";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = "8px";
        iframe.setAttribute('title', 'YouTube video player');

        // Implement lazy loading
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
        return container;
    };

    FormManager.showExpandedVideo = function(videoUrl) {
        // Remove any existing video modal
        const existingModal = document.querySelector('.symphytum-video-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'symphytum-video-modal';
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

        const video = document.createElement('video');
        video.src = videoUrl;
        video.controls = true;
        video.autoplay = true;
        video.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        `;

        container.appendChild(video);
        container.appendChild(closeButton);
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

    // Override the renderCell method to handle videos
    const originalCreateInputElement = FormManager.createInputElement;
    FormManager.createInputElement = function(column, record, fontSize) {
        // Remove any existing previews
        const existingPreviews = document.querySelectorAll('.symphytum-video-preview, .symphytum-youtube-preview');
        existingPreviews.forEach(preview => preview.remove());

        const container = document.createElement('div');
        container.className = 'video-input-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';

        // Create input wrapper
        const inputWrapper = document.createElement('div');
        inputWrapper.style.display = 'flex';
        inputWrapper.style.alignItems = 'center';
        inputWrapper.style.gap = '8px';
        inputWrapper.style.width = '100%';

        // Create URL input
        const input = document.createElement('input');
        input.type = 'text';
        input.id = column.id;
        input.name = column.id;
        input.className = 'video-url-input';
        input.value = record.data[column.id] || '';
        input.style.fontSize = `${fontSize}px`;
        input.style.width = '100%';

        inputWrapper.appendChild(input);
        container.appendChild(inputWrapper);

        // Add video preview if URL is present and valid
        const url = record.data[column.id];
        if (url) {
            if (this.isYouTubeUrl(url)) {
                const preview = this.createYouTubePreview(url);
                if (preview) container.appendChild(preview);
            } else if (this.isMP4Url(url)) {
                const preview = this.createMP4Preview(url);
                if (preview) container.appendChild(preview);
            } else if (column.type === 'url') {
                // For non-video URLs, use the original URL handling
                return originalCreateInputElement.call(this, column, record, fontSize);
            }
        }

        // Update preview when input changes
        input.addEventListener('input', (e) => {
            const newUrl = e.target.value;
            const existingPreview = container.querySelector('.symphytum-video-preview, .symphytum-youtube-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            if (newUrl) {
                let preview = null;
                if (this.isYouTubeUrl(newUrl)) {
                    preview = this.createYouTubePreview(newUrl);
                } else if (this.isMP4Url(newUrl)) {
                    preview = this.createMP4Preview(newUrl);
                }
                if (preview) container.appendChild(preview);
            }
        });

        return container;
    };
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    addVideoSupport();
});

export default addVideoSupport;