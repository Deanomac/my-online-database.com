// dataManager.js
import { DatabaseManager } from './databaseManager.js';
import { AppState } from './appState.js';
import { TableManager } from './tableManager.js';
import { ColumnManager } from './columnManager.js';
import { RecordManager } from './recordManager.js';
import { ErrorManager } from './errorManager.js';
import { UI } from './ui.js';

export const DataManager = {
    // Import Methods
    async importData(file, tableName) {
        try {
            UI.showLoadingSpinner();
            
            const options = this.getImportOptions();
            let data;

            if (options.format === 'paste') {
                data = await this.parsePastedData(options);
            } else {
                const fileFormat = file.name.split('.').pop().toLowerCase();
                data = await this.parseFileData(file, { ...options, format: fileFormat });
            }

            // Validate and transform the data
            this.validateImportData(data);
            const transformedData = this.transformImportData(data);

            // Create table and import data
            await this.createTableFromData(tableName, transformedData);
            
            UI.hideImportModal();
            return true;
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        } finally {
            UI.hideLoadingSpinner();
        }
    },

    getImportOptions() {
        return {
            format: document.getElementById('importFormat')?.value || 'csv',
            hasHeader: document.getElementById('headerLine')?.checked ?? true,
            separator: document.getElementById('fieldSeparator')?.value || ',',
            quote: document.getElementById('quoteCharacter')?.value || '"',
            encoding: document.getElementById('encoding')?.value || 'UTF-8',
            trimFields: document.getElementById('trimFields')?.checked ?? true
        };
    },

    async parseFileData(file, options) {
        try {
            const text = await file.text();
            
            switch (options.format) {
                case 'json':
                    return await this.parseJSONFile(text);
                case 'csv':
                case 'tsv':
                case 'txt':
                    return this.parseDelimitedFile(text, options);
                default:
                    throw new Error(`Unsupported file format: ${options.format}`);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'EncodingError') {
                throw new Error('File encoding error. Try using a different encoding in the import options.');
            }
            throw error;
        }
    },

    async parseJSONFile(text) {
        try {
            const data = JSON.parse(text);

            if (Array.isArray(data)) {
                // Handle array of objects
                const firstRow = data[0] || {};
                const columns = Object.keys(firstRow).map(key => ({
                    name: key,
                    type: this.inferColumnType(firstRow[key])
                }));

                return {
                    columns,
                    rows: data.map(row => {
                        const newRow = {};
                        columns.forEach(col => {
                            newRow[col.name] = row[col.name] ?? '';
                        });
                        return newRow;
                    })
                };
            } else if (data.columns && (data.records || data.rows)) {
                // Handle our export format
                return {
                    columns: data.columns,
                    rows: (data.records || data.rows).map(record => 
                        record.data || record
                    )
                };
            } else {
                throw new Error('Invalid JSON format');
            }
        } catch (error) {
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }
    },

    parseDelimitedFile(text, options) {
        const lines = text.split('\n').filter(line => line.trim());
        if (!lines.length) {
            throw new Error('File is empty');
        }

        // Parse header line
        const firstLine = this.parseLine(lines[0], options);
        const columns = options.hasHeader
            ? firstLine.map((name, i) => ({
                name: name.trim() || `Column${i + 1}`,
                type: 'text'
            }))
            : firstLine.map((_, i) => ({
                name: `Column${i + 1}`,
                type: 'text'
            }));

        // Parse data lines
        const dataLines = options.hasHeader ? lines.slice(1) : lines;
        const rows = dataLines.map(line => {
            const values = this.parseLine(line, options);
            const row = {};
            columns.forEach((col, i) => {
                row[col.name] = values[i] ?? '';
            });
            return row;
        });

        return { columns, rows };
    },

    parseLine(line, options) {
        const values = [];
        let value = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === options.quote) {
                inQuotes = !inQuotes;
            } else if (char === options.separator && !inQuotes) {
                values.push(options.trimFields ? value.trim() : value);
                value = '';
            } else {
                value += char;
            }
        }
        values.push(options.trimFields ? value.trim() : value);

        return values;
    },

    async parsePastedData(options) {
        const text = document.getElementById('pasteData')?.value;
        if (!text?.trim()) {
            throw new Error('No data pasted');
        }
        return this.parseDelimitedFile(text, options);
    },

    // Export Methods
    async exportData(format) {
        try {
            UI.showLoadingSpinner();
            switch (format.toLowerCase()) {
                case 'json':
                    await this.exportJSONData();
                    break;
                case 'csv':
                    await this.exportCSVData();
                    break;
                default:
                    throw new Error('Unsupported export format. Please choose JSON or CSV.');
            }
        } catch (error) {
            ErrorManager.showError('Export failed', error);
        } finally {
            UI.hideLoadingSpinner();
        }
    },

    exportJSONData() {
        const data = {
            tables: AppState.tables,
            columns: AppState.columns,
            records: AppState.records,
        };
        this.downloadFile(
            JSON.stringify(data, null, 2),
            `database_export_${new Date().toISOString()}.json`,
            'application/json'
        );
    },

    exportCSVData() {
        const rows = [
            AppState.columns.map(col => `"${col.name.replace(/"/g, '""')}"`).join(',')
        ];

        AppState.records.forEach(record => {
            const row = AppState.columns.map(
                col => `"${String(record.data[col.id] || '').replace(/"/g, '""')}"`
            );
            rows.push(row.join(','));
        });

        this.downloadFile(
            rows.join('\n'),
            `database_export_${new Date().toISOString()}.csv`,
            'text/csv'
        );
    },

    // Utility Methods
async createTableFromData(tableName, data) {
    const tableId = await TableManager.createNewTable(tableName);
    
    // Add Record # column first
    await ColumnManager.addColumn("Record #", "number");
    
    // Create other columns
    for (const column of data.columns) {
        await ColumnManager.addColumn(column.name, column.type || 'text');
    }

    // Import rows
    for (const row of data.rows) {
        const rowData = {};
        data.columns.forEach((col, index) => {
            rowData[AppState.columns[index + 1].id] = row[col.name] || '';
        });
        await RecordManager.addRowWithData(rowData);
    }
},

    validateImportData(data) {
        if (!data?.columns?.length) {
            throw new Error('No columns found in import data');
        }
        if (!data?.rows?.length) {
            throw new Error('No rows found in import data');
        }
        if (data.columns.some(col => !col.name)) {
            throw new Error('Invalid column name in import data');
        }
    },

    transformImportData(data) {
        return {
            columns: data.columns.map(col => ({
                ...col,
                type: col.type || this.inferColumnType(data.rows[0]?.[col.name])
            })),
            rows: data.rows.map(row => {
                const newRow = {};
                data.columns.forEach(col => {
                    newRow[col.name] = row[col.name]?.toString() || '';
                });
                return newRow;
            })
        };
    },

    inferColumnType(value) {
        if (value === null || value === undefined) return 'text';
        if (typeof value === 'number') return 'number';
        if (value instanceof Date) return 'date';
        if (typeof value === 'boolean') return 'boolean';
        
        const str = String(value).trim();
        
        // Check for date
        if (!isNaN(Date.parse(str))) return 'date';
        
        // Check for number
        if (!isNaN(str) && str !== '') return 'number';
        
        // Check for email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return 'email';
        
        return 'text';
    },

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};