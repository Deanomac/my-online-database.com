// js/refresh.js

import { TableManager } from './tableManager.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get the refresh button element
    const refreshBtn = document.getElementById('refreshBtn');

    // Add click event listener to the refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            try {
                // Show loading spinner or disable the button during refresh
                refreshBtn.disabled = true;
                UI.showLoadingSpinner();

                // Call the method to reload the table data
                await TableManager.loadTableData();

                // Hide loading spinner and re-enable the button
                UI.hideLoadingSpinner();
                refreshBtn.disabled = false;

                // Optionally, show a brief confirmation message
                console.log('Table data refreshed successfully.');
            } catch (error) {
                UI.hideLoadingSpinner();
                refreshBtn.disabled = false;
                console.error('Error refreshing table data:', error);
                alert('Failed to refresh table data.');
            }
        });
    } else {
        console.error('Refresh button not found in the DOM.');
    }
});
