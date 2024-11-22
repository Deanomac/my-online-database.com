// toolbarObserver.js
import { TableManager } from './tableManager.js';
import { FormManager } from './formManager.js';
import { AppState } from './appState.js';
import { UI } from './ui.js';
import { Notifications } from './notifications.js';

export const ToolbarObserver = {
    observer: null,
    debounceTimeout: null,

    init() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Create mutation observer
        this.observer = new MutationObserver(this.handleMutations.bind(this));

        // Configure and start observing
        const config = {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class', 'style', 'disabled']
        };

        this.observer.observe(toolbar, config);

        // Add click listeners to toolbar buttons
        this.attachToolbarListeners(toolbar);
    },

    handleMutations(mutations) {
        // Debounce the refresh to prevent multiple rapid updates
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(async () => {
            try {
                UI.showLoadingSpinner();
                await this.refreshCurrentView();
            } catch (error) {
                console.error('Error refreshing view:', error);
                Notifications.error('Failed to update view');
            } finally {
                UI.hideLoadingSpinner();
            }
        }, 300);
    },

    async refreshCurrentView() {
        try {
            // First update the data
            await TableManager.loadTableData();

            // Then update the current view
            if (AppState.viewMode === 'form') {
                FormManager.displayCurrentRecord();
                FormManager.reapplyInputStyles();
            } else {
                await TableManager.renderRecords();
            }
        } catch (error) {
            console.error('Error refreshing current view:', error);
            throw error;
        }
    },

    attachToolbarListeners(toolbar) {
        // Get all interactive elements in toolbar
        const interactiveElements = toolbar.querySelectorAll(
            'button:not(.excluded-from-refresh), select, input[type="text"], input[type="number"]'
        );

        interactiveElements.forEach(element => {
            // Remove old listeners by cloning
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);

            // Add new listeners
            newElement.addEventListener('click', this.handleInteraction.bind(this));
            
            if (newElement.tagName === 'SELECT' || 
                newElement.type === 'text' || 
                newElement.type === 'number') {
                newElement.addEventListener('change', this.handleInteraction.bind(this));
                
                if (newElement.type === 'number') {
                    newElement.addEventListener('input', this.handleInteraction.bind(this));
                }
            }
        });
    },

    handleInteraction(event) {
        // Don't refresh on certain interactions
        const skipRefreshClasses = [
            'search-input',          // Skip search input changes
            'font-size-control',     // Skip font size changes
            'view-controls',         // Skip view toggle buttons
            'db4sql-toolbar-btn',    // Handle style buttons separately
            'excluded-from-refresh'  // Skip explicitly excluded elements
        ];

        const skipRefreshIds = [
            'tableViewBtn',
            'formViewBtn',
            'searchInput',
            'db4sql-boldBtn',
            'db4sql-italicBtn',
            'db4sql-underlineBtn',
            'db4sql-colorPickerBtn'
        ];

        const target = event.target;
        const skipRefresh = skipRefreshClasses.some(className => 
            target.classList.contains(className)) || 
            skipRefreshIds.includes(target.id);

        if (!skipRefresh) {
            this.debouncedRefresh();
        }
    },

    debouncedRefresh() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(async () => {
            try {
                UI.showLoadingSpinner();
                await this.refreshCurrentView();
            } catch (error) {
                console.error('Error refreshing view:', error);
                Notifications.error('Failed to update view');
            } finally {
                UI.hideLoadingSpinner();
            }
        }, 300);
    },

    cleanup() {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Clear timeout
        clearTimeout(this.debounceTimeout);

        // Remove event listeners
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            const buttons = toolbar.querySelectorAll('button, select, input');
            buttons.forEach(button => {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
            });
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ToolbarObserver.init();
});

export default ToolbarObserver;