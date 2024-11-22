// ui.js
import { TableManager } from './tableManager.js';
import { ColumnManager } from './columnManager.js';
import { RecordManager } from './recordManager.js';
import { SettingsManager } from './settingsManager.js';
import { ErrorManager } from './errorManager.js';
import { DeleteConfirmModal } from './deleteConfirmModal.js';
import { FormManager } from './formManager.js';
import { DataManager } from './dataManager.js';
import { AppState } from './appState.js';
import { ImportManager } from './importManager.js';

class UIManager {
    constructor() {
this.initialized = false;
    this.elements = {};
    this.eventHandlers = new WeakMap();
    this.initCallbacks = new Set();
}

onInitialized(callback) {
    if (this.initialized) {
        callback();
    } else {
        this.initCallbacks.add(callback);
    }
}

async initialize() {
    if (this.initialized) return;

    try {
        this.initializeElements();
        this.validateElements();
        this.initializeViews();
              this.initializeViewButtons(); // Add this line

        this.attachEventListeners();
        this.loadCustomCSS();
        this.setupAppStateObserver();

        this.initialized = true;
        
        // Call any registered callbacks
        this.initCallbacks.forEach(callback => callback());
        this.initCallbacks.clear();
    } catch (error) {
        console.error('UI initialization error:', error);
        ErrorManager.showError('Failed to initialize UI', error);
    }
}

    initializeViews() {
        if (this.elements.tableView) {
            this.elements.tableView.style.display = "none";
        }
        if (this.elements.formView) {
            this.elements.formView.style.display = "none";
        }
    }

    initializeElements() {
        // Required elements
        const requiredElements = {
            tableView: "tableView",
            formView: "formView",
            dataTable: "dataTable",
            recordForm: "recordForm",
            tableSelect: "tableSelect",
            tableViewBtn: "tableViewBtn",
            formViewBtn: "formViewBtn",
            addTableBtn: "addTableBtn",
            addColumnBtn: "addColumnBtn",
            addRowBtn: "addRowBtn",
            settingsBtn: "settingsBtn",
            searchInput: "searchInput",
            modalBackdrop: "modalBackdrop",
            loadingSpinner: "loadingSpinner",
            deleteTableBtn: "deleteTableBtn",
            toggleDeleteButtons: "toggleDeleteButtons",
            createTableModal: "createTableModal",
            newTableName: "newTableName",
            createEmpty: "createEmpty",
            createImport: "createImport",
            createTableBtn: "createTableBtn"
        };

        // Optional elements
        const optionalElements = {
            // Import modal elements
            importModal: "importModal",
            importTableName: "importTableName", 
            importFormat: "importFormat",
            headerLine: "headerLine",
            fieldSeparator: "fieldSeparator",
            quoteCharacter: "quoteCharacter",
            encoding: "encoding",
            trimFields: "trimFields", 
            importFile: "importFile",
            pasteData: "pasteData",
            cancelImportBtn: "cancelImportBtn",
            importBtn: "importBtn",
            closeImportModal: "closeImportModal", // Added

            // Settings elements
            settingsModal: "settingsModal",
            closeSettings: "closeSettings",
            customCssEditor: "customCssEditor",
            applyCustomCssBtn: "applyCustomCss",
            defaultThemeBtn: "defaultTheme",
            themeRadios: "themeRadios",

            // Modal elements
            closeCreateTableModal: "closeCreateTableModal",
            cancelCreateTableBtn: "cancelCreateTableBtn",
            closeColumnModal: "closeColumnModal",
            cancelColumnBtn: "cancelColumnBtn",
            saveColumnBtn: "saveColumnBtn",

            // Form navigation buttons
            prevRecordBtn: "prevRecordBtn",  // Added
            nextRecordBtn: "nextRecordBtn"   // Added
        };

        // Initialize required elements
        for (const [key, id] of Object.entries(requiredElements)) {
            const element = document.getElementById(id);
            if (element) {
                this.elements[key] = element;
            } else {
                throw new Error(`Required element with ID '${id}' not found`);
            }
        }

        // Initialize optional elements
        for (const [key, id] of Object.entries(optionalElements)) {
            const element = document.getElementById(id);
            if (element) {
                this.elements[key] = element;
            }
        }

        // Initialize delete button state
        if (this.elements.deleteTableBtn) {
            this.elements.deleteTableBtn.style.display = 'none';
            this.elements.deleteTableBtn.disabled = true;
        }
    }
    validateElements() {
        const requiredElements = [
            'tableView', 'formView', 'dataTable', 'recordForm', 
            'tableSelect', 'addTableBtn', 'modalBackdrop'
        ];

        const missingElements = requiredElements.filter(key => !this.elements[key]);
        if (missingElements.length > 0) {
            throw new Error(`Missing required UI elements: ${missingElements.join(', ')}`);
        }
    }

    attachEventListeners() {
        this.attachViewListeners();
        this.attachTableOperationListeners();
        this.attachModalListeners();
        this.attachSettingsListeners();
        this.attachFormListeners();
        this.attachImportListeners();
        this.attachSearchListeners();
    }

    attachViewListeners() {
        this.addSafeEventListener(this.elements.tableViewBtn, 'click', 
            () => TableManager.switchView("table"));
        
        this.addSafeEventListener(this.elements.formViewBtn, 'click', 
            () => TableManager.switchView("form"));
    }

    attachTableOperationListeners() {
        this.addSafeEventListener(this.elements.addTableBtn, 'click', 
            () => this.showCreateTableModal());
        
        this.addSafeEventListener(this.elements.addColumnBtn, 'click', 
            () => ColumnManager.showAddColumnModal());
        
        this.addSafeEventListener(this.elements.addRowBtn, 'click', 
            () => RecordManager.addRow());
        
        if (this.elements.deleteTableBtn) {
            this.addSafeEventListener(this.elements.deleteTableBtn, 'click', (e) => {
                if (!AppState.currentTableId || this.elements.deleteTableBtn.disabled) {
                    e.preventDefault();
                    return;
                }
                TableManager.deleteCurrentTable();
            });
        }
        
        this.addSafeEventListener(this.elements.tableSelect, 'change', 
            (e) => TableManager.switchTable(parseInt(e.target.value)));
    }

    attachModalListeners() {
        // Create Table Modal
        const createTableModal = this.elements.createTableModal;
        if (createTableModal) {
            this.addSafeEventListener(this.elements.closeCreateTableModal, 'click', 
                () => this.hideCreateTableModal());
            
            this.addSafeEventListener(this.elements.cancelCreateTableBtn, 'click', 
                () => this.hideCreateTableModal());
            
            this.addSafeEventListener(this.elements.createTableBtn, 'click', 
                () => this.handleCreateTable());

            // Toggle create/import mode
            const tableOptions = createTableModal.querySelectorAll('input[name="tableOption"]');
            tableOptions.forEach(option => {
                option.addEventListener('change', () => {
                    const nextBtn = this.elements.createTableBtn;
                    if (nextBtn) {
                        nextBtn.textContent = option.value === 'empty' ? 'Create' : 'Next';
                    }
                });
            });
        }

        // Import Modal
        if (this.elements.importModal) {
            this.addSafeEventListener(this.elements.closeImportModal, 'click', 
                () => this.hideImportModal());
            
            this.addSafeEventListener(this.elements.cancelImportBtn, 'click', 
                () => this.hideImportModal());
            
            this.addSafeEventListener(this.elements.importBtn, 'click', 
                () => this.handleImport());
        }

        // Modal Backdrop
        this.addSafeEventListener(this.elements.modalBackdrop, 'click', () => {
            this.hideAllModals();
        });
    }

    attachSettingsListeners() {
        this.addSafeEventListener(this.elements.settingsBtn, 'click', 
            () => SettingsManager.showPanel());
        
        this.addSafeEventListener(this.elements.closeSettings, 'click', 
            () => SettingsManager.hidePanel());
        
        this.addSafeEventListener(this.elements.applyCustomCssBtn, 'click', 
            () => SettingsManager.applyCustomCSS());
        
        this.addSafeEventListener(this.elements.defaultThemeBtn, 'click', 
            () => SettingsManager.resetToDefault());
    }

    attachFormListeners() { 
        this.addSafeEventListener(this.elements.prevRecordBtn, 'click',
            () => FormManager.navigateRecord(-1));

        this.addSafeEventListener(this.elements.nextRecordBtn, 'click',
            () => FormManager.navigateRecord(1));
    }


attachImportListeners() {
    const formatSelect = document.getElementById('importFormat');
    if (formatSelect) {
        formatSelect.addEventListener('change', (e) => this.handleFormatChange(e));
    }
    
    // Initialize the display state
    this.handleFormatChange({ target: { value: 'paste' } });
}

    attachSearchListeners() {
        let searchTimeout;
        this.addSafeEventListener(this.elements.searchInput, 'input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => TableManager.renderRecords(), 300);
        });

        this.addSafeEventListener(this.elements.searchInput, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.elements.searchInput.value = '';
                TableManager.renderRecords();
            }
        });
    }

    showCreateTableModal() {
        const modal = this.elements.createTableModal;
        const backdrop = this.elements.modalBackdrop;
        const nameInput = this.elements.newTableName;
        const createEmpty = this.elements.createEmpty;
        
        if (!modal || !backdrop || !nameInput) return;

        // Reset form
        nameInput.value = '';
        if (createEmpty) createEmpty.checked = true;
        
        // Show modal
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        nameInput.focus();
    }

    async handleCreateTable() {
    const tableName = this.elements.newTableName?.value.trim();
    if (!tableName) {
        alert('Please enter a table name');
        return;
    }

    try {
        if (this.elements.createEmpty?.checked) {
            this.showLoadingSpinner();
            await TableManager.createNewTable(tableName);
            this.hideCreateTableModal();
            alert('Table created successfully');
        } else {
            this.hideCreateTableModal();
            this.showImportModal(tableName);
        }
    } catch (error) {
        alert('Failed to create table: ' + error.message);
    } finally {
        this.hideLoadingSpinner();
    }
}


    showImportModal(tableName = '') {
    const modal = this.elements.importModal;
    const backdrop = this.elements.modalBackdrop;

    if (!modal || !backdrop) return;

    if (this.elements.importTableName) {
        this.elements.importTableName.value = tableName;
    }

    this.resetImportFormFields();
    modal.style.display = 'block';
    backdrop.style.display = 'block';
    this.elements.importTableName?.focus();

    // Initialize event listeners for the import modal
    this.initializeImportModalEvents();
}


resetImportFormFields() {
    const elements = this.elements;

    if (elements.importFormat) elements.importFormat.value = 'csv';
    if (elements.hasHeaders) elements.hasHeaders.checked = true;
    if (elements.separator) elements.separator.value = ',';
    if (elements.customSeparator) elements.customSeparator.value = '';
    if (elements.importFile) elements.importFile.value = '';
    if (elements.pasteData) elements.pasteData.value = '';
    if (elements.googleSheetsUrl) elements.googleSheetsUrl.value = '';

    // Hide or show form groups based on the default format
    this.updateImportFormVisibility();

    // Clear data preview
    const dataPreview = document.getElementById('dataPreview');
    if (dataPreview) dataPreview.innerHTML = '';
}


initializeViewButtons() {
    const tableViewBtn = document.getElementById('tableViewBtn');
    const formViewBtn = document.getElementById('formViewBtn');

    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', () => {
            if (TableManager?.switchView) {
                TableManager.switchView('table');
            }
        });
    }

    if (formViewBtn) {
        formViewBtn.addEventListener('click', () => {
            if (TableManager?.switchView) {
                TableManager.switchView('form');
            }
        });
    }

    // Set initial view
    if (TableManager?.switchView) {
        TableManager.switchView('table'); // Start with table view
    }
}
async handleImport() {
    const tableName = document.getElementById('importTableName')?.value.trim();
    if (!tableName) {
        alert('Please enter a table name');
        return;
    }

    const format = document.getElementById('importFormat')?.value;
    const hasHeaders = document.getElementById('hasHeaders')?.checked ?? true;
    let separator = document.getElementById('separator')?.value;
    const customSeparator = document.getElementById('customSeparator')?.value;
    const importFile = document.getElementById('importFile');
    const pasteData = document.getElementById('pasteData');
    const googleSheetsUrl = document.getElementById('googleSheetsUrl');

    if (separator === 'custom') {
        separator = customSeparator || '';
        if (!separator) {
            alert('Please enter a custom separator');
            return;
        }
    }

    this.showLoadingSpinner();
    try {
        let source;
        let options = { hasHeaders, separator };

        switch (format) {
            case 'googlesheets':
                source = googleSheetsUrl?.value.trim();
                if (!source) {
                    alert('Please enter a Google Sheets URL');
                    return;
                }
                break;
            case 'paste':
                source = pasteData?.value;
                if (!source?.trim()) {
                    alert('Please paste some data');
                    return;
                }
                break;
            default:
                if (!importFile?.files.length) {
                    alert('Please select a file');
                    return;
                }
                source = importFile.files[0];
        }

        console.log('Starting import with:', { format, tableName, source, options });
        await ImportManager.importData(source, format, tableName, options);
        
        this.hideImportModal();
        await TableManager.loadTables();
        alert('Data imported successfully');
    } catch (error) {
        console.error('Import error:', error);
        ErrorManager.showError('Error importing data', error);
    } finally {
        this.hideLoadingSpinner();
    }
}
initializeImportModalEvents() {
    const importFormat = document.getElementById('importFormat');
    const separator = document.getElementById('separator');
    const customSeparatorGroup = document.getElementById('customSeparatorGroup');
    const customSeparator = document.getElementById('customSeparator');
    const hasHeaders = document.getElementById('hasHeaders');
    const importFile = document.getElementById('importFile');
    const pasteData = document.getElementById('pasteData');
    const googleSheetsUrl = document.getElementById('googleSheetsUrl');

    // Event listeners
    importFormat.addEventListener('change', () => {
        this.updateImportFormVisibility();
        this.updatePreview();
    });

    separator.addEventListener('change', () => {
        if (separator.value === 'custom') {
            customSeparatorGroup.style.display = 'block';
        } else {
            customSeparatorGroup.style.display = 'none';
        }
        this.updatePreview();
    });

    customSeparator.addEventListener('input', () => this.updatePreview());
    hasHeaders.addEventListener('change', () => this.updatePreview());
    pasteData.addEventListener('input', () => this.updatePreview());
    googleSheetsUrl.addEventListener('input', () => this.updatePreview());
    importFile.addEventListener('change', () => this.updatePreview());

    // Initial visibility setup
    this.updateImportFormVisibility();
}
updateImportFormVisibility() {
    const format = document.getElementById('importFormat')?.value;
    const pasteGroup = document.getElementById('pasteGroup');
    const fileInputGroup = document.getElementById('fileInputGroup');
    const googleSheetsGroup = document.getElementById('googleSheetsGroup');

    // Hide all groups initially
    if (pasteGroup) pasteGroup.style.display = 'none';
    if (fileInputGroup) fileInputGroup.style.display = 'none';
    if (googleSheetsGroup) googleSheetsGroup.style.display = 'none';

    // Show the relevant group
    if (format === 'paste') {
        if (pasteGroup) pasteGroup.style.display = 'block';
    } else if (format === 'googlesheets') {
        if (googleSheetsGroup) googleSheetsGroup.style.display = 'block';
    } else {
        if (fileInputGroup) fileInputGroup.style.display = 'block';
    }

    // Handle custom separator visibility
    const separator = document.getElementById('separator');
    const customSeparatorGroup = document.getElementById('customSeparatorGroup');
    if (separator?.value === 'custom') {
        customSeparatorGroup.style.display = 'block';
    } else {
        customSeparatorGroup.style.display = 'none';
    }
}
async updatePreview() {
    const format = document.getElementById('importFormat')?.value;
    const hasHeaders = document.getElementById('hasHeaders')?.checked ?? true;
    let separator = document.getElementById('separator')?.value;
    const customSeparator = document.getElementById('customSeparator')?.value;
    const importFile = document.getElementById('importFile');
    const pasteData = document.getElementById('pasteData');
    const googleSheetsUrl = document.getElementById('googleSheetsUrl');

    if (separator === 'custom') {
        separator = customSeparator || '';
        if (!separator) {
            // Do not update preview if custom separator is empty
            return;
        }
    }

    let source;
    let options = { hasHeaders, separator };

    try {
        switch (format) {
            case 'googlesheets':
                source = googleSheetsUrl?.value.trim();
                if (!source) return;
                break;
            case 'paste':
                source = pasteData?.value;
                if (!source?.trim()) return;
                break;
            default:
                if (!importFile?.files.length) return;
                source = importFile.files[0];
        }

        await ImportManager.updatePreview(source, format, options);
    } catch (error) {
        console.error('Error updating preview:', error);
        UI.showPreviewError(error.message);
    }
}


// Make sure your format change handler is updated
handleFormatChange(e) {
    const format = e.target.value;
    const fileGroup = document.getElementById('fileInputGroup');
    const pasteGroup = document.getElementById('pasteGroup');
    const googleSheetsGroup = document.getElementById('googleSheetsGroup');
    const separatorGroup = document.getElementById('separatorGroup');

    // Hide all groups first
    [fileGroup, pasteGroup, googleSheetsGroup].forEach(el => {
        if (el) el.style.display = 'none';
    });

    // Show appropriate group based on format
    switch (format) {
        case 'paste':
            if (pasteGroup) pasteGroup.style.display = 'block';
            if (separatorGroup) separatorGroup.style.display = 'block';
            break;
        case 'googlesheets':
            if (googleSheetsGroup) googleSheetsGroup.style.display = 'block';
            if (separatorGroup) separatorGroup.style.display = 'none';
            break;
        case 'csv':
        case 'tsv':
            if (fileGroup) fileGroup.style.display = 'block';
            if (separatorGroup) separatorGroup.style.display = 'block';
            break;
        default:
            if (fileGroup) fileGroup.style.display = 'block';
            if (separatorGroup) separatorGroup.style.display = 'none';
    }
}
  
    hideCreateTableModal() {
        if (this.elements.createTableModal) {
            this.elements.createTableModal.style.display = 'none';
        }
        if (this.elements.modalBackdrop) {
            this.elements.modalBackdrop.style.display = 'none';
        }
    }

    hideImportModal() {
        if (this.elements.importModal) {
            this.elements.importModal.style.display = 'none';
        }
        if (this.elements.modalBackdrop) {
            this.elements.modalBackdrop.style.display = 'none';
        }
        this.resetImportFormFields();
    }

    hideAllModals() {
        this.hideCreateTableModal();
        this.hideImportModal();
        
        if (this.elements.modalBackdrop) {
            this.elements.modalBackdrop.style.display = 'none';
        }
        
        ColumnManager.hideAddColumnModal();
        DeleteConfirmModal.hide();
        SettingsManager.hidePanel();
    }

showLoadingSpinner() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = "block";
            this.elements.loadingSpinner.setAttribute("aria-hidden", "false");
        }
    }

    hideLoadingSpinner() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = "none";
            this.elements.loadingSpinner.setAttribute("aria-hidden", "true");
        }
    }

    addSafeEventListener(element, event, handler, options = false) {
        if (!element) return;

        // Remove existing handler if present
        const existingHandler = this.eventHandlers.get(element)?.[event];
        if (existingHandler) {
            element.removeEventListener(event, existingHandler);
        }

        // Store and add new handler
        this.eventHandlers.set(element, {
            ...(this.eventHandlers.get(element) || {}),
            [event]: handler
        });
        
        element.addEventListener(event, handler, options);
    }

    loadCustomCSS() {
        const customCss = localStorage.getItem("customCss");
        if (customCss && this.elements.customCssEditor) {
            this.elements.customCssEditor.value = customCss;
            let styleElement = document.getElementById("customStyles");
            
            if (!styleElement) {
                styleElement = document.createElement("style");
                styleElement.id = "customStyles";
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = customCss;
        }
    }

    setupAppStateObserver() {
        let currentTableId = AppState.currentTableId;
        
        Object.defineProperty(AppState, 'currentTableId', {
            get: () => currentTableId,
            set: (value) => {
                currentTableId = value;
                this.updateUIForTableChange(value);
            }
        });
    }

    updateUIForTableChange(tableId) {
        if (this.elements.deleteTableBtn) {
            const hasTable = Boolean(tableId);
            this.elements.deleteTableBtn.classList.toggle('visible', hasTable);
            this.elements.deleteTableBtn.disabled = !hasTable;
            this.elements.deleteTableBtn.style.pointerEvents = hasTable ? 'auto' : 'none';
        }

        // Update other UI elements that depend on table selection
        if (this.elements.addColumnBtn) {
            this.elements.addColumnBtn.disabled = !tableId;
        }
        if (this.elements.addRowBtn) {
            this.elements.addRowBtn.disabled = !tableId;
        }
    }

    updateButtonStates() {
        const hasCurrentTable = Boolean(AppState.currentTableId);
        
        if (this.elements.deleteTableBtn) {
            this.elements.deleteTableBtn.disabled = !hasCurrentTable;
            this.elements.deleteTableBtn.style.display = hasCurrentTable ? 'inline-flex' : 'none';
        }

        if (this.elements.addColumnBtn) {
            this.elements.addColumnBtn.disabled = !hasCurrentTable;
        }

        if (this.elements.addRowBtn) {
            this.elements.addRowBtn.disabled = !hasCurrentTable;
        }
    }
  renderDataPreview(data) {
        const previewDiv = document.getElementById('dataPreview');
        if (!previewDiv) return;

        // Clear existing preview
        previewDiv.innerHTML = '';

        // Create preview table
        const table = document.createElement('table');
        table.className = 'preview-table';

        // Add headers
        if (data.headers) {
            const headerRow = document.createElement('tr');
            data.headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);
        }

        // Add data rows
        data.rows.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        previewDiv.appendChild(table);
    }

    showPreviewError(message) {
        const previewDiv = document.getElementById('dataPreview');
        if (!previewDiv) return;

        previewDiv.innerHTML = `<div class="preview-error">${message}</div>`;
    }

    toggleElementVisibility(element, show) {
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    safeHideModal(modal) {
        if (modal && typeof modal.style !== 'undefined') {
            modal.style.display = 'none';
        }
    }

    cleanup() {
        // Remove all event listeners
        for (const [element, handlers] of this.eventHandlers.entries()) {
            for (const [event, handler] of Object.entries(handlers)) {
                element.removeEventListener(event, handler);
            }
        }
        
        // Clear state
        this.eventHandlers = new WeakMap();
        this.elements = {};
        this.initialized = false;

        // Remove any custom styles
        const customStyles = document.getElementById('customStyles');
        if (customStyles) {
            customStyles.remove();
        }
    }
}

const UI = new UIManager();

// Export both the class and the instance
export { UIManager, UI };

// And add this line to expose UI to the window object for global access
window.UI = UI;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UI.initialize();
});

// Cleanup on unload
window.addEventListener('unload', () => {
    UI.cleanup();
});