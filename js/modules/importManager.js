// importManager.js
import { UI } from "./ui.js";
import { FileHandler, withErrorHandling } from "./fileHandler.js";
import { TableRenderManager } from "./tableRenderManager.js";
import { DatabaseManager } from "./databaseManager.js";
import { AppState } from "./appState.js";
import { TableManager } from "./tableManager.js";
import { ColumnManager } from "./columnManager.js";
import { RecordManager } from "./recordManager.js";
import { ErrorManager } from "./errorManager.js";

export class ImportManager {
  constructor() {
    this.initialized = false;
  }

  static supportedFormats = {
    paste: { name: "Paste Data" },
    csv: { name: "CSV", extension: ".csv", mimeType: "text/csv" },
    tsv: { name: "TSV", extension: ".tsv", mimeType: "text/tab-separated-values" },
    json: { name: "JSON", extension: ".json", mimeType: "application/json" },
    html: { name: "HTML Table", extension: ".html", mimeType: "text/html" },
    sqlite: { name: "SQLite Browser", extension: ".txt", mimeType: "text/plain" },
    googlesheets: { name: "Google Sheets", extension: ".csv", mimeType: "text/csv" },
    pdf: { name: "PDF", extension: ".pdf", mimeType: "application/pdf" }
  };

  static defaultOptions = {
    hasHeaders: true,
    separator: ",",
    encoding: "UTF-8", 
    skipEmpty: true,
    trimValues: true
  };

    static async importData(source, format, tableName, options = {}) {
        try {
            UI.showLoadingSpinner();
            
            const importOptions = { ...ImportManager.defaultOptions, ...options };
            let data;

            switch (format.toLowerCase()) {
                case 'googlesheets':
                    data = await ImportManager.importGoogleSheets(source, importOptions);
                    break;
                case 'paste':
                    data = await ImportManager.parsePastedData(source, importOptions);
                    break;
                case 'csv':
                    data = await ImportManager.parseCSV(source, importOptions);
                    break;
                case 'tsv':
                    data = await ImportManager.parseCSV(source, { ...importOptions, separator: '\t' });
                    break;
                case 'json':
                    data = await ImportManager.parseJSON(source);
                    break;
                case 'html':
                    data = await ImportManager.parseHTML(source);
                    break;
                case 'pdf':
                    data = await ImportManager.parsePDF(source, importOptions);
                    break;
                case 'sqlite':
                    data = await ImportManager.parseSQLiteBrowser(source);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            if (!data?.headers || !data?.rows) {
                throw new Error("Invalid data format returned from parser");
            }

            const result = await ImportManager.createTableFromData(tableName, data);
            await TableRenderManager.initialize();
            return result;

        } catch (error) {
            console.error("Import error:", error);
            throw new Error(`Import failed: ${error.message}`);
        } finally {
            UI.hideLoadingSpinner();
        }
    }

    static async parsePastedData(source, options = {}) {
        try {
            const text = await ImportManager.getTextFromSource(source);
            
            // Try to detect the separator
            const firstLine = text.split('\n')[0];
            let separator = '\t'; // Default to tab
            
            if (firstLine.includes(',')) {
                separator = ',';
            } else if (firstLine.includes(';')) {
                separator = ';';
            }

            // Clean up the data
            const cleanedText = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('\n');

            return ImportManager.parseCSV(cleanedText, {
                ...options,
                separator: separator,
                skipEmpty: true,
                trimValues: true
            });
        } catch (error) {
            console.error("Error parsing pasted data:", error);
            throw new Error(`Failed to parse pasted data: ${error.message}`);
        }
    }


  static async getTextFromSource(source) {
    if (source instanceof Blob) {
      return await source.text();
    } else if (typeof source === "string") {
      return source;
    }
    throw new Error("Invalid source type");
  }

  static async getDataFromSource(source, format) {
    if (source instanceof Blob) {
      if (format === "pdf") {
        return await source.arrayBuffer();
      } else {
        return await source.text();
      }
    } else if (typeof source === "string") {
      return source;
    }
    throw new Error("Invalid source type");
  }

static async parsePastedData(source, options = {}) {
    try {
        const text = await this.getTextFromSource(source);
        
        // Try to detect the separator
        const firstLine = text.split('\n')[0];
        let separator = '\t'; // Default to tab
        
        if (firstLine.includes(',')) {
            separator = ',';
        } else if (firstLine.includes(';')) {
            separator = ';';
        }

        // Clean up the data
        const cleanedText = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');

        return this.parseCSV(cleanedText, {
            ...options,
            separator: separator,
            skipEmpty: true,
            trimValues: true
        });
    } catch (error) {
        console.error("Error parsing pasted data:", error);
        throw new Error(`Failed to parse pasted data: ${error.message}`);
    }
}
static renderPreview(data) {
    const previewDiv = document.getElementById('dataPreview');
    if (!previewDiv) return;

    // Create preview table
    let html = '<table class="preview-table" style="width:100%; border-collapse: collapse;">';
    
    // Add headers
    if (data.headers) {
        html += '<thead><tr>';
        data.headers.forEach(header => {
            html += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f8f9fa;">${header}</th>`;
        });
        html += '</tr></thead>';
    }

    // Add row preview (first 5 rows)
    html += '<tbody>';
    data.rows.slice(0, 5).forEach(row => {
        html += '<tr>';
        data.headers.forEach(header => {
            html += `<td style="border: 1px solid #ddd; padding: 8px;">${row[header] || ''}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    previewDiv.innerHTML = html;
}
 static async parseCSV(source, options = {}) {
    const text = await this.getTextFromSource(source);
    return new Promise((resolve, reject) => {
        if (!window.Papa) {
            reject(new Error("PapaParse is not loaded"));
            return;
        }

        const generateHeaders = (rowLength) => {
            return Array.from({ length: rowLength }, (_, i) => `Column ${i + 1}`);
        };

        window.Papa.parse(text, {
            delimiter: options.separator || ",",
            header: options.hasHeaders || false,
            skipEmptyLines: options.skipEmpty || false,
            transformHeader: (header) =>
                options.trimValues ? header.trim() : header,
            transform: (value) => (options.trimValues ? value.trim() : value),
            complete: (results) => {
                console.log("PapaParse Results:", results);
                const headers = options.hasHeaders 
                    ? results.meta.fields 
                    : generateHeaders(results.data[0]?.length || 0);
                resolve({
                    headers: headers,
                    rows: results.data,
                });
            },
            error: (error) => {
                console.error("PapaParse Error:", error);
                reject(error);
            },
        });
    });
}

  static async parseJSON(source) {
    const text = await this.getTextFromSource(source);
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        if (!json.length) throw new Error("Empty JSON array");
        const headers = Object.keys(json[0]);
        const rows = json.map((obj) => headers.map((header) => obj[header]));
        return { headers, rows };
      }
      throw new Error("JSON must be an array of objects");
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  static async parseHTML(source) {
    const text = await this.getTextFromSource(source);
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const table = doc.querySelector("table");

    if (!table) throw new Error("No table found in HTML");

    const headers = Array.from(table.querySelectorAll("th")).map((th) => 
      th.textContent.trim()
    );

    const rows = Array.from(table.querySelectorAll("tr"))
      .slice(1) // Skip header row
      .map((row) =>
        Array.from(row.querySelectorAll("td")).map((td) =>
          td.textContent.trim()
        )
      );

    return { headers, rows };
  }

  // Helper function for generating default headers
  static generateHeaders(columnCount) {
    return Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
  }
// Continue in ImportManager class...

  static extractSheetInfo(url) {
    try {
      const idPattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const gidPattern = /gid=([0-9]+)/;

      const idMatch = url.match(idPattern);
      const gidMatch = url.match(gidPattern);

      const sheetId = idMatch ? idMatch[1] : null;
      const gid = gidMatch ? gidMatch[1] : "0"; // Default gid is '0'

      return { sheetId, gid };
    } catch (error) {
      console.error("Error extracting sheet info:", error);
      return { sheetId: null, gid: null };
    }
  }

  static async importGoogleSheets(url, options = {}) {
    try {
      let { sheetId, gid } = this.extractSheetInfo(url);
      if (!sheetId) {
        throw new Error("Invalid Google Sheets URL");
      }

      gid = options.gid || gid || "0";

      const exportUrls = [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&gid=${gid}`
      ];

      let response;
      let error;

      for (const exportUrl of exportUrls) {
        try {
          console.log("Trying URL:", exportUrl);
          response = await fetch(exportUrl);
          if (response.ok) {
            console.log("Successfully fetched CSV from:", exportUrl);
            break;
          }
        } catch (e) {
          console.error("Error fetching URL:", exportUrl, e);
          error = e;
        }
      }

      if (!response?.ok) {
        throw error || new Error(`Failed to fetch sheet (Status: ${response?.status})`);
      }

      const csvData = await response.text();
      return await this.parseCSV(csvData, {
        hasHeaders: options.hasHeaders ?? true,
        separator: ",",
        trimValues: true,
      });
    } catch (error) {
      console.error("Google Sheets import error:", error);
      throw new Error(`Google Sheets import failed: ${error.message}`);
    }
  }

  static async parsePDF(source, options = {}) {
    let arrayBuffer;
    if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else {
      throw new Error("Invalid source type for PDF");
    }

    const pdfText = await this.extractTextFromPDF(arrayBuffer);
    return await this.parseCSV(pdfText, options);
  }

  static async extractTextFromPDF(arrayBuffer) {
    return new Promise((resolve, reject) => {
      if (!window.pdfjsLib) {
        reject(new Error("pdf.js library is not loaded"));
        return;
      }

      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      loadingTask.promise.then(
        async (pdf) => {
          const textPromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map(item => item.str)
              .join(" ");
            textPromises.push(pageText);
          }
          resolve(textPromises.join("\n"));
        },
        (error) => {
          console.error("PDF loading error:", error);
          reject(error);
        }
      );
    });
  }
// Continue in ImportManager class...

  static async createTableFromData(tableName, data) {
    try {
      UI.showLoadingSpinner();
      console.log("Creating table with data:", { tableName, data });

      // Create the table
      const tableId = await this.createTable(tableName);
      console.log(`Table created with ID: ${tableId}`);

      // Create columns without Record #
      const columnIds = await this.createColumns(tableId, data.headers, data);
      console.log("Columns created with IDs:", columnIds);

      // Create records
      await this.createRecords(tableId, columnIds, data.rows);
      console.log("Records created successfully.");

      // Update AppState
      AppState.currentTableId = tableId;

      // Load and render table data
      await TableManager.loadTableData();
      await TableRenderManager.renderRecords();

      console.log("AppState and UI updated.");
      UI.hideLoadingSpinner();

      return { success: true, tableId };
    } catch (error) {
      UI.hideLoadingSpinner();
      console.error("Error creating table:", error);
      throw new Error(`Failed to create table: ${error.message}`);
    }
  }

  static async createTable(tableName) {
    const transaction = DatabaseManager.db.transaction("tables", "readwrite");
    const store = transaction.objectStore("tables");

    const table = {
      name: tableName,
      created: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(table);
      request.onsuccess = () => {
        console.log(`Table "${tableName}" added to 'tables' store.`);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error("Error adding table:", request.error);
        reject(request.error);
      };
    });
  }

  static async createColumns(tableId, headers, data) {
    const transaction = DatabaseManager.db.transaction("columns", "readwrite");
    const store = transaction.objectStore("columns");
    const columnIds = {};

    for (let i = 0; i < headers.length; i++) {
      const columnName = headers[i];
      
      // Get column values for type inference
      const columnValues = data.rows.map(row => 
        Array.isArray(row) ? row[i] : row[columnName]
      );
      const inferredType = this.inferColumnType(columnValues);

      const column = {
        name: columnName,
        type: inferredType,
        tableId: tableId,
        order: i,
        created: new Date().toISOString(),
      };

      const columnId = await new Promise((resolve, reject) => {
        const request = store.add(column);
        request.onsuccess = () => {
          console.log(`Column "${columnName}" added with ID: ${request.result}`);
          resolve(request.result);
        };
        request.onerror = () => {
          console.error(`Error adding column "${columnName}":`, request.error);
          reject(request.error);
        };
      });

      columnIds[columnName] = columnId;
    }

    return columnIds;
  }
// Continue in ImportManager class...

  static async createRecords(tableId, columnIds, rows) {
    const transaction = DatabaseManager.db.transaction("records", "readwrite");
    const store = transaction.objectStore("records");
    const columnNames = Object.keys(columnIds);

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const record = {
        tableId: tableId,
        data: {},
      };

      // Handle both array and object formats
      if (Array.isArray(rowData)) {
        columnNames.forEach((name, index) => {
          record.data[columnIds[name]] = rowData[index] || "";
        });
      } else {
        columnNames.forEach(name => {
          record.data[columnIds[name]] = rowData[name] || "";
        });
      }

      await new Promise((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => {
          if (i % 100 === 0) {
            console.log(`Record ${i + 1} added.`);
          }
          resolve();
        };
        request.onerror = () => {
          console.error(`Error adding record ${i + 1}:`, request.error);
          reject(request.error);
        };
      });
    }

    console.log(`All ${rows.length} records added to 'records' store.`);
  }

  static inferColumnType(values) {
    if (!values?.length) return "text";

    const samples = values
      .slice(0, 10)
      .filter(v => v !== null && v !== undefined && v !== "");

    if (samples.length === 0) return "text";

    // Check patterns
    const patterns = {
      number: /^-?\d*\.?\d+$/,
      date: /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/,
      url: /^https?:\/\/(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    // Test patterns
    for (const [type, pattern] of Object.entries(patterns)) {
      if (samples.every(v => pattern.test(v.toString()))) {
        return type;
      }
    }

    // Check for long text
    if (samples.some(v => v.toString().length > 100)) {
      return "textarea";
    }

    return "text";
  }

static async updatePreview(source, format, options = {}) {
    try {
        const fileContent = await this.getDataFromSource(source, format);
        let data;

        switch (format.toLowerCase()) {
            case "paste":
                data = await this.parsePastedData(fileContent, {
                    hasHeaders: true,
                    skipEmpty: true,
                    trimValues: true
                });
                break;
            case "csv":
                data = await this.parseCSV(fileContent, {
                    ...options,
                    separator: ',',
                });
                break;
            case "tsv":
                data = await this.parseCSV(fileContent, {
                    ...options,
                    separator: '\t',
                });
                break;
        case "json":
          data = await this.parseJSON(fileContent);
          break;
        case "html":
          data = await this.parseHTML(fileContent);
          break;
        case "sqlite":
          data = await this.parseSQLiteBrowser(fileContent);
          break;
        case "googlesheets":
          data = await this.importGoogleSheets(fileContent, options);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

if (data) {
            // Limit preview to first 5 rows
            const previewData = {
                headers: data.headers,
                rows: data.rows.slice(0, 5)
            };
            this.renderPreview(previewData);
        }
    } catch (error) {
        console.error('Preview update error:', error);
        const previewDiv = document.getElementById('dataPreview');
        if (previewDiv) {
            previewDiv.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    }
}
// Add these to the ImportManager class

static validateImportData(data) {
    // Check if data exists and has required properties
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
    }

    // Check headers
    if (!Array.isArray(data.headers) || data.headers.length === 0) {
        throw new Error('No columns found in import data');
    }

    // Check rows
    if (!Array.isArray(data.rows) || data.rows.length === 0) {
        throw new Error('No rows found in import data');
    }

    // Validate header names
    if (data.headers.some(header => !header || typeof header !== 'string')) {
        throw new Error('Invalid column names found');
    }

    return true;
}

static transformImportData(data) {
    return {
        headers: data.headers.map(header => ({
            name: header,
            type: this.inferColumnType(data.rows.map(row => row[header]))
        })),
        rows: data.rows.map(row => {
            const newRow = {};
            data.headers.forEach(header => {
                newRow[header] = String(row[header] || '').trim();
            });
            return newRow;
        })
    };
}

static async parseSQLiteBrowser(source) {
    return this.parseCSV(source, { 
        separator: '\t', 
        hasHeaders: true 
    });
}

  static cleanup() {
    // Optional cleanup tasks
    console.log('Import cleanup completed');
  }
} // Close ImportManager class

export default ImportManager;