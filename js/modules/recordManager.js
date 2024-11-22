import { DatabaseManager } from './databaseManager.js';
import { AppState } from './appState.js';
import { TableManager } from './tableManager.js';
import { UI } from './ui.js';
import { Notifications } from './notifications.js';

export const RecordManager = {
    async loadRecords(tableId) {
        try {
            const transaction = DatabaseManager.db.transaction("records", "readonly");
            const store = transaction.objectStore("records");
            const index = store.index("tableId");

            return new Promise((resolve, reject) => {
                const request = index.getAll(tableId);
                request.onsuccess = () => {
                    // Remove the forced ID sort - let TableManager handle sorting
                    const records = request.result;
                    AppState.records = records;
                    resolve(records);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error("Error loading records:", error);
            throw error;
        }
    },

   async addRow() {
    if (!AppState.currentTableId) return;

    try {
        UI.showLoadingSpinner();

        const newRecord = {
            tableId: AppState.currentTableId,
            data: AppState.columns.reduce((acc, column) => ({
                ...acc,
                [column.id]: ""
            }), {})
        };

        const transaction = DatabaseManager.db.transaction("records", "readwrite");
        const store = transaction.objectStore("records");

        await new Promise((resolve, reject) => {
            const request = store.add(newRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await this.loadRecords(AppState.currentTableId);
        await TableManager.renderRecords();

        Notifications.success('New row added successfully');
    } catch (error) {
        console.error("Error adding row:", error);
        Notifications.error('Failed to add new row: ' + error.message);
    } finally {
        UI.hideLoadingSpinner();
    }
},

    async addRowWithData(data) {
        if (!AppState.currentTableId) return;

        try {

            const maxId = Math.max(0, ...AppState.records.map(r => r.id || 0));
            const newId = maxId + 1;

            const newRecord = {
                id: newId,
                tableId: AppState.currentTableId,
                data: data
            };

            const transaction = DatabaseManager.db.transaction("records", "readwrite");
            const store = transaction.objectStore("records");

            await new Promise((resolve, reject) => {
                const request = store.add(newRecord);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            await this.loadRecords(AppState.currentTableId);
            await TableManager.renderRecords();
        } catch (error) {
            console.error("Error adding row with data:", error);
            throw error;
        }
    },

    // recordManager.js
async updateRecord(recordId, data, options = {}) {
    try {
        const transaction = DatabaseManager.db.transaction("records", "readwrite");
        const store = transaction.objectStore("records");

        return new Promise((resolve, reject) => {
            const getRequest = store.get(recordId);
            getRequest.onsuccess = () => {
                const record = getRequest.result;
                if (!record) {
                    reject(new Error('Record not found'));
                    return;
                }

                record.data = data;
                const updateRequest = store.put(record);
                updateRequest.onsuccess = async () => {
                    // Update AppState
                    const recordIndex = AppState.records.findIndex(r => r.id === recordId);
                    if (recordIndex !== -1) {
                        AppState.records[recordIndex].data = data;
                    }
                    
                    // Only show notification if not silent
                    if (!options.silent) {
                        Notifications.success('Record updated successfully');
                    }
                    
                    resolve();
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    } catch (error) {
        console.error("Error updating record:", error);
        throw error;
    }
},

 async deleteRecord(recordId) {
        try {
            const transaction = DatabaseManager.db.transaction("records", "readwrite");
            const store = transaction.objectStore("records");

            await new Promise((resolve, reject) => {
                const request = store.delete(recordId);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });

            AppState.records = AppState.records.filter(record => record.id !== recordId);

            // Don't force reindex after delete - maintain current sort
            await TableManager.renderRecords();

            Notifications.success('Record deleted successfully');
        } catch (error) {
            console.error("Error deleting record:", error);
            throw error;
        }
    },

    // We'll only call reindexRecords when explicitly needed
    async reindexRecords() {
        try {
            const transaction = DatabaseManager.db.transaction("records", "readwrite");
            const store = transaction.objectStore("records");

            // Keep current sort order when reindexing
            const currentRecords = [...AppState.records];

            for (let i = 0; i < currentRecords.length; i++) {
                const record = currentRecords[i];
                const oldId = record.id;
                record.id = i + 1;
                await new Promise((resolve, reject) => {
                    const request = store.put(record);
                    request.onsuccess = resolve;
                    request.onerror = () => reject(request.error);
                });
            }

            AppState.records = currentRecords;
        } catch (error) {
            console.error("Error reindexing records:", error);
            throw error;
        }
    }
};

export default RecordManager;