// headerEditor.js
export const initializeHeaderEditor = () => {
    // Get the settings section container
    const settingsModal = document.getElementById('settingsModal');
    const modalBody = settingsModal.querySelector('.modal-body');

    // Create header editor section
    const headerSection = document.createElement('div');
    headerSection.className = 'settings-section';
    headerSection.innerHTML = `
        <h3>Header Customization</h3>
        <div class="form-group">
            <label for="headerText">Header Text</label>
            <input type="text" id="headerText" class="form-input" value="my-online-database.com">
        </div>
        <div class="form-group">
            <label for="headerColor">Text Color</label>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="color" id="headerColor" value="#ffffff" style="width: 50px; height: 30px;">
                <input type="text" id="headerColorText" class="form-input" value="#ffffff" style="width: 100px;">
            </div>
        </div>
        <div class="form-group">
            <label for="headerImage">Header Image URL</label>
            <input type="text" id="headerImage" class="form-input" value="https://i.imgur.com/41ykvVf.png">
            <div style="margin-top: 10px;">
                <img id="headerImagePreview" src="https://i.imgur.com/41ykvVf.png" alt="Preview" 
                     style="width: 50px; height: 50px; object-fit: contain; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
        </div>
        <button id="saveHeaderChanges" class="button button-primary" style="width: 100%; margin-top: 10px;">
            Save Header Changes
        </button>
        <button id="resetHeaderChanges" class="button button-secondary" style="width: 100%; margin-top: 10px;">
            Reset to Default
        </button>
    `;

    // Insert the section before the danger zone
    const dangerZone = modalBody.querySelector('.danger-zone');
    modalBody.insertBefore(headerSection, dangerZone);

    // Load saved values
    const loadSavedValues = () => {
        const savedText = localStorage.getItem('customHeaderText');
        const savedColor = localStorage.getItem('customHeaderColor');
        const savedImage = localStorage.getItem('customHeaderImage');

        if (savedText) document.getElementById('headerText').value = savedText;
        else document.getElementById('headerText').value = 'my-online-database.com';

        if (savedColor) {
            document.getElementById('headerColor').value = savedColor;
            document.getElementById('headerColorText').value = savedColor;
        } else {
            document.getElementById('headerColor').value = '#ffffff';
            document.getElementById('headerColorText').value = '#ffffff';
        }

        if (savedImage) {
            document.getElementById('headerImage').value = savedImage;
            document.getElementById('headerImagePreview').src = savedImage;
        } else {
            document.getElementById('headerImage').value = 'https://i.imgur.com/41ykvVf.png';
            document.getElementById('headerImagePreview').src = 'https://i.imgur.com/41ykvVf.png';
        }

        // Apply saved values to header
        applyHeaderChanges(false);
    };

    // Apply changes to the header
    const applyHeaderChanges = (saveToStorage = true) => {
        const headerText = document.getElementById('headerText').value;
        const headerColor = document.getElementById('headerColor').value;
        const headerImage = document.getElementById('headerImage').value;

        // Update header elements
        const headerTitle = document.querySelector('.app-header h1');
        const headerImg = document.querySelector('#myUniqueButtonImage');

        if (headerTitle) {
            headerTitle.textContent = headerText;
            headerTitle.style.color = headerColor;
        }

        if (headerImg) {
            headerImg.src = headerImage;
        }

        // Save to localStorage if needed
        if (saveToStorage) {
            localStorage.setItem('customHeaderText', headerText);
            localStorage.setItem('customHeaderColor', headerColor);
            localStorage.setItem('customHeaderImage', headerImage);
        }
    };

    // Reset header to default values
    const resetHeaderChanges = () => {
        // Clear localStorage entries
        localStorage.removeItem('customHeaderText');
        localStorage.removeItem('customHeaderColor');
        localStorage.removeItem('customHeaderImage');

        // Load default values
        loadSavedValues();

        alert('Header has been reset to default!');
    };

    // Event Listeners
    document.getElementById('headerColor').addEventListener('input', (e) => {
        document.getElementById('headerColorText').value = e.target.value;
    });

    document.getElementById('headerColorText').addEventListener('input', (e) => {
        document.getElementById('headerColor').value = e.target.value;
    });

    document.getElementById('headerImage').addEventListener('input', (e) => {
        document.getElementById('headerImagePreview').src = e.target.value;
    });

    document.getElementById('saveHeaderChanges').addEventListener('click', () => {
        applyHeaderChanges(true);
        alert('Header changes saved successfully!');
    });

    document.getElementById('resetHeaderChanges').addEventListener('click', () => {
        resetHeaderChanges();
    });

    // Load saved values when initialized
    loadSavedValues();
};

// Add styles
const style = document.createElement('style');
style.textContent = `
    .settings-section .form-group {
        margin-bottom: 15px;
    }

    .settings-section label {
        display: block;
        margin-bottom: 5px;
        color: var(--text-primary);
    }

    .settings-section .form-input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background: var(--bg-primary);
        color: var(--text-primary);
    }

    .settings-section h3 {
        margin-bottom: 15px;
        color: var(--text-primary);
    }
`;
document.head.appendChild(style);

export default initializeHeaderEditor;
