// toggleDeleteButtons.js
import { TableManager } from './tableManager.js';
import { ErrorManager } from './errorManager.js';
import { UI } from './ui.js';

const STORAGE_KEY = 'deleteButtonsVisible';

class DeleteButtonManager {
    constructor() {
        this.toggleSwitch = null;
        this.initialized = false;
    }

    async toggleDeleteButtons(show) {
        try {
            // Store state in localStorage
            localStorage.setItem(STORAGE_KEY, show);
            
            // Update UI
            if (this.toggleSwitch) {
                this.toggleSwitch.checked = show;
            }

            // Wait for table to be ready
            if (UI.elements.dataTable) {
                await TableManager.updateTableDisplay();
            }

            // Update any other delete buttons
            this.updateAllDeleteButtons(show);
        } catch (error) {
            console.error('Error toggling delete buttons:', error);
            ErrorManager.showError('Failed to toggle delete buttons', error);
        }
    }

    updateAllDeleteButtons(show) {
        document.querySelectorAll('.delete-button, .deleteTableBtn, #deleteTableBtn.visible, .delete-column-btn, .delete-row-btn')
            .forEach(button => {
                if (button) {
                    button.style.display = show ? 'inline-flex' : 'none';
                    button.style.pointerEvents = show ? 'auto' : 'none';
                }
            });
    }

    async initializeToggleSwitch() {
        if (this.initialized) return;

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            this.toggleSwitch = document.getElementById('toggleDeleteButtons');
            if (!this.toggleSwitch) {
                console.warn('Toggle switch element not found');
                return;
            }

            // Get saved state
            const savedState = localStorage.getItem(STORAGE_KEY) === 'true';
            
            // Set initial state
            this.toggleSwitch.checked = savedState;
            
            // Add event listener
            this.toggleSwitch.addEventListener('change', async (event) => {
                await this.toggleDeleteButtons(event.target.checked);
            });

            // Add keyboard support
            this.toggleSwitch.addEventListener('keydown', async (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.toggleSwitch.checked = !this.toggleSwitch.checked;
                    await this.toggleDeleteButtons(this.toggleSwitch.checked);
                }
            });

            // Apply initial state
            await this.toggleDeleteButtons(savedState);

            this.initialized = true;
        } catch (error) {
            console.error('Error initializing toggle switch:', error);
            ErrorManager.showError('Failed to initialize delete buttons toggle', error);
        }
    }

    isDeleteEnabled() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    reset() {
        this.toggleDeleteButtons(false);
    }
}

const deleteButtonManager = new DeleteButtonManager();

// Export functions
export const initializeToggleSwitch = () => deleteButtonManager.initializeToggleSwitch();
export const isDeleteEnabled = () => deleteButtonManager.isDeleteEnabled();
export const resetDeleteButtons = () => deleteButtonManager.reset();
export const initializeDeleteButtons = async () => {
    await deleteButtonManager.initializeToggleSwitch();
};

// Initialize when DOM is loaded and UI is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.onInitialized(() => {
        deleteButtonManager.initializeToggleSwitch();
    });
});