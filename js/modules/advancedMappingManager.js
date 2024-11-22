// advancedMappingManager.js
import { AppState } from './appState.js';
import { UI } from './ui.js';
import { DataManager } from './dataManager.js';
import { ColumnManager } from './columnManager.js';
import { TableManager } from './tableManager.js';
import { ErrorManager } from './errorManager.js';
import { Notifications } from './notifications.js';

export const AdvancedMappingManager = {
    showMappingModal(importDataColumns) {
        // Create and show a modal for mapping
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.id = "advancedMappingModal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-labelledby", "advancedMappingModalTitle");
        modal.setAttribute("aria-modal", "true");
        modal.innerHTML = `
            <div class="modal-header">
                <h3 id="advancedMappingModalTitle">Advanced Mapping</h3>
                <button class="button" id="closeMappingModal" aria-label="Close Mapping Modal">×</button>
            </div>
            <div class="modal-content">
                <form id="mappingForm">
                    ${importDataColumns
                        .map(
                            (col) => `
                        <div class="form-group">
                            <label for="map_${col}">Map "${col}" to:</label>
                            <select id="map_${col}" name="map_${col}">
                                <option value="">-- Select Column --</option>
                                ${AppState.columns
                                    .map(
                                        (existingCol) => `
                                    <option value="${existingCol.id}">${existingCol.name}</option>
                                `
                                    )
                                    .join("")}
                            </select>
                        </div>
                    `
                        )
                        .join("")}
                    <div class="form-group">
                        <label for="delimiter">CSV Delimiter:</label>
                        <input type="text" id="delimiter" name="delimiter" value="," maxlength="1">
                    </div>
                    <div class="form-group">
                        <label for="encoding">Character Encoding:</label>
                        <select id="encoding" name="encoding">
                            <option value="utf-8">UTF-8</option>
                            <option value="iso-8859-1">ISO-8859-1</option>
                            <!-- Add more encodings as needed -->
                        </select>
                    </div>
                </form>
                <div class="progress-bar-container" id="mappingProgressContainer" style="display:none;">
                    <div class="progress-bar" id="mappingProgressBar"></div>
                </div>
                <div class="error-message" id="mappingErrorMessage"></div>
            </div>
            <div class="modal-footer">
                <button class="button" id="cancelMappingBtn">Cancel</button>
                <button class="button" id="saveMappingBtn">Save Mapping</button>
            </div>
        `;
        document.body.appendChild(modal);
        document
            .getElementById("mappingForm")
            .addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleMappingSubmit(importDataColumns);
            });
        document
            .getElementById("closeMappingModal")
            .addEventListener("click", () => this.hideMappingModal());
        document
            .getElementById("cancelMappingBtn")
            .addEventListener("click", () => this.hideMappingModal());
        document
            .getElementById("saveMappingBtn")
            .addEventListener("click", () => {
                const form = document.getElementById("mappingForm");
                form.dispatchEvent(new Event('submit'));
            });
    },
    hideMappingModal() {
        const modal = document.getElementById("advancedMappingModal");
        if (modal) {
            document.body.removeChild(modal);
        }
    },
    async handleMappingSubmit(importDataColumns) {
        const mapping = {};
        importDataColumns.forEach((col) => {
            const selected = document.getElementById(`map_${col}`).value;
            if (selected) {
                mapping[col] = selected;
            }
        });
        const delimiter = document.getElementById("delimiter").value || ",";
        const encoding = document.getElementById("encoding").value;

        // Show progress bar
        const progressContainer = document.getElementById(
            "mappingProgressContainer"
        );
        const progressBar = document.getElementById("mappingProgressBar");
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";

        try {
            // Implement the mapping logic here
            // For example, adjust the importData function to accept mapping and delimiter
            await DataManager.importCSVWithMapping(
                importDataColumns,
                mapping,
                delimiter,
                encoding
            );
            this.hideMappingModal();
           Notifications.success("Data imported with advanced mapping successfully.");
        } catch (error) {
            const errorMessage = document.getElementById("mappingErrorMessage");
            errorMessage.textContent = `Error: ${error.message}`;
            console.error("Advanced Mapping Error:", error);
        } finally {
            progressBar.style.width = "100%";
            setTimeout(() => {
                progressContainer.style.display = "none";
                progressBar.style.width = "0%";
            }, 2000);
        }
    },
};
