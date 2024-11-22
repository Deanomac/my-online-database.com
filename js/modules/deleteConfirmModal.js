// deleteConfirmModal.js
import { RecordManager } from './recordManager.js';
import { TableManager } from './tableManager.js';
import { UI } from './ui.js';
import { AppState } from './appState.js';
import { Notifications } from './notifications.js'

export const DeleteConfirmModal = {
    currentItemId: null,
    currentItemType: null,
    modalHtml: `
        <div id="deleteConfirmModal" class="modal" role="dialog" aria-labelledby="deleteConfirmTitle">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="deleteConfirmTitle">Confirm Delete</h3>
                    <button id="closeDeleteModal" class="close-button" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <p id="deleteConfirmMessage"></p>
                </div>
                <div class="modal-footer">
                    <button id="cancelDeleteBtn" class="button">Cancel</button>
                    <button id="confirmDeleteBtn" class="button button-danger">Delete</button>
                </div>
            </div>
        </div>
    `,

    initialize() {
        // Create modal if it doesn't exist
        if (!document.getElementById('deleteConfirmModal')) {
            document.body.insertAdjacentHTML('beforeend', this.modalHtml);
            this.attachEventListeners();
        }
    },

    show(itemId, itemType) {
        this.initialize(); // Ensure modal exists

        this.currentItemId = itemId;
        this.currentItemType = itemType;

        const modal = document.getElementById('deleteConfirmModal');
        const message = document.getElementById('deleteConfirmMessage');
        const backdrop = document.getElementById('modalBackdrop');
        
        if (!modal || !message || !backdrop) {
            console.error('Required modal elements not found');
            return;
        }

        // Set appropriate message
        if (itemType === 'record') {
            message.textContent = 'Are you sure you want to delete this record? This action cannot be undone.';
        } else if (itemType === 'table') {
            message.textContent = 'Are you sure you want to delete this table? This will remove all associated columns and records.';
        }

        // Show modal and backdrop
        modal.style.display = 'block';
        backdrop.style.display = 'block';
    },

    hide() {
        const modal = document.getElementById('deleteConfirmModal');
        const backdrop = document.getElementById('modalBackdrop');
        
        if (modal) modal.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
        
        this.currentItemId = null;
        this.currentItemType = null;
    },

async confirm() {
    if (!this.currentItemId || !this.currentItemType) {
        console.error('No item selected for deletion');
        return;
    }

    try {
        UI.showLoadingSpinner();

        if (this.currentItemType === 'record') {
            await RecordManager.deleteRecord(this.currentItemId);
            await TableManager.loadTableData();
            Notifications.success('Record deleted successfully');
        } else if (this.currentItemType === 'table') {
            await TableManager.deleteSpecificTable(this.currentItemId);
            await TableManager.loadTables();
            
            // If the deleted table was the current table, reset the view
            if (AppState.currentTableId === this.currentItemId) {
                AppState.currentTableId = null;
                AppState.columns = [];
                AppState.records = [];
                if (AppState.tables.length > 0) {
                    await TableManager.switchTable(AppState.tables[0].id);
                }
            }
            
            Notifications.success('Table deleted successfully');
        }

        this.hide();
    } catch (error) {
        console.error('Delete operation failed:', error);
        Notifications.error('Failed to delete: ' + error.message);
    } finally {
        UI.hideLoadingSpinner();
    }
},

    attachEventListeners() {
        const modal = document.getElementById('deleteConfirmModal');
        if (!modal) return;

        // Close button handler
        const closeBtn = modal.querySelector('#closeDeleteModal');
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }

        // Cancel button handler
        const cancelBtn = modal.querySelector('#cancelDeleteBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.hide();
        }

        // Confirm button handler
        const confirmBtn = modal.querySelector('#confirmDeleteBtn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirm();
        }

        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.hide();
            }
        });

        // Backdrop click handler
        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.hide();
                }
            });
        }
    }
};

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    DeleteConfirmModal.initialize();
});