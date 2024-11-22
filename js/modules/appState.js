// appState.js
export const AppState = {
    currentTableId: null,
    tables: [],
    columns: [],
    records: [],
    currentSort: { column: null, direction: "asc" },
    draggedColumn: null,
    viewMode: "table", // Add this to track current view
    currentRecordIndex: 0,
    bulkImportData: [], // For bulk operations
    bulkExportData: [], // For bulk operations
};
