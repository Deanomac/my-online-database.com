// settingsManager.js
import { TableRenderManager } from './tableRenderManager.js';
import { UI } from './ui.js';
import { ErrorManager } from './errorManager.js';
import { TableManager } from './tableManager.js';

const defaultThemeClass = 'theme-light';

export const SettingsManager = {
    initialized: false,
    presetThemes: {
        light: 'theme-light',
        dark: 'theme-dark',
        blue: 'theme-blue',
        hellokitty: 'theme-hellokitty',
        hacker: 'theme-hacker',
        rgb: 'theme-rgb',
        excel: 'theme-excel',
        christmas: 'theme-christmas',
        thanksgiving: 'theme-thanksgiving',
        easter: 'theme-easter',
        paintblob: 'theme-paintblob',
        dogecoin: 'theme-dogecoin',
        applepc: 'theme-applepc',
        windows98: 'theme-windows98',
      dos: 'theme-dos'
    },

    init() {
        if (this.initialized) return;
        
        this.initializeTheme();
        this.initializeSettingsPanel();
        this.initializeDeleteToggle();
        this.syncInitialState();
        
        this.initialized = true;
    },

    getSavedTheme() {
        return localStorage.getItem('selectedTheme') || 'light';
    },

    handleThemeChange(theme) {
        // Remove existing theme classes
        Object.values(this.presetThemes).forEach(cls => {
            document.body.classList.remove(cls);
        });

        // Add new theme class
        const themeClass = this.presetThemes[theme] || this.presetThemes.light;
        document.body.classList.add(themeClass);

        // Save theme preference
        localStorage.setItem('selectedTheme', theme);

        // Apply theme-specific effects
        this.addThemeEffects(theme);
          const clouds = document.querySelector('.theme-windows98 .app-header .clouds');
    if (clouds) {
      clouds.style.display = theme === 'windows98' ? 'block' : 'none';
    }

    },

    resetToDefault() {
        // Remove custom CSS
        this.applyCustomCss('');
        localStorage.removeItem('customCss');

        // Apply default theme
        this.handleThemeChange('light');
        localStorage.setItem('selectedTheme', 'light');

        // Reset radio buttons
        const lightRadio = document.querySelector(`input[name="theme"][value="light"]`);
        if (lightRadio) {
            lightRadio.checked = true;
        }

        // Reset custom CSS editor
        const customCssEditor = document.getElementById('customCssEditor');
        if (customCssEditor) {
            customCssEditor.value = '';
        }

        // Remove any theme effects
        this.removeThemeEffects();

        // Update UI elements
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = 'light';
        }

        alert('Theme reset to default successfully.');
    },

    addThemeEffects(selectedTheme) {
        this.removeThemeEffects();

        if (selectedTheme === 'hacker') {
            this.addMatrixEffect();
        }
        if (selectedTheme === 'rgb') {
            this.addRGBEffect();
        }
    },

    removeThemeEffects() {
        const existingMatrix = document.querySelector('.matrix-background');
        if (existingMatrix) existingMatrix.remove();

        const existingTrails = document.querySelectorAll('.rgb-trail');
        existingTrails.forEach(trail => trail.remove());

        if (this.rgbTrailHandler) {
            document.removeEventListener('mousemove', this.rgbTrailHandler);
            this.rgbTrailHandler = null;
        }

        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
            this.matrixInterval = null;
        }
    },

    addMatrixEffect() {
        const matrix = document.createElement('div');
        matrix.className = 'matrix-background';
        document.body.appendChild(matrix);

        this.matrixInterval = setInterval(() => {
            const char = document.createElement('span');
            char.textContent = String.fromCharCode(0x30A0 + Math.random() * 96);
            char.style.left = Math.random() * 100 + 'vw';
            char.style.animationDuration = Math.random() * 2 + 1 + 's';
            matrix.appendChild(char);
            setTimeout(() => char.remove(), 3000);
        }, 50);
    },

    addRGBEffect() {
        this.rgbTrailHandler = (e) => {
            const trail = document.createElement('div');
            trail.className = 'rgb-trail';
            trail.style.left = e.pageX + 'px';
            trail.style.top = e.pageY + 'px';
            document.body.appendChild(trail);
            setTimeout(() => trail.remove(), 1000);
        };

        document.addEventListener('mousemove', this.rgbTrailHandler);
    },

    applyCustomCss(css) {
        let styleElement = document.getElementById('customStyles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'customStyles';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = css;
        localStorage.setItem('customCss', css);
    },

    initializeTheme() {
        const themeSelect = document.getElementById('themeSelect');
        const resetThemeBtn = document.getElementById('resetTheme');

        if (themeSelect) {
            themeSelect.value = this.getSavedTheme();
            themeSelect.addEventListener('change', (e) => {
                this.handleThemeChange(e.target.value);
            });
        }

        if (resetThemeBtn) {
            resetThemeBtn.addEventListener('click', () => {
                this.resetToDefault();
            });
        }

        this.handleThemeChange(this.getSavedTheme());
    },

    initializeSettingsPanel() {
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsModal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showPanel());
        }
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hidePanel());
        }
    },

    initializeDeleteToggle() {
        const deleteToggle = document.getElementById('octoberToggleDelete');
        if (!deleteToggle) return;

        const savedState = localStorage.getItem('deleteButtonsVisible') === 'true';
        deleteToggle.checked = savedState;

        deleteToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('deleteButtonsVisible', isEnabled);
            this.updateDeleteButtonsVisibility(isEnabled);
        });

        this.updateDeleteButtonsVisibility(savedState);
    },

    updateDeleteButtonsVisibility(isVisible) {
        try {
            const elements = {
                deleteButtons: document.querySelectorAll('.delete-row-button, .delete-column-btn'),
                deleteTableBtn: document.getElementById('deleteTableBtn'),
                actionsColumn: document.querySelectorAll('.actions-column'),
                deleteRowBtns: document.querySelectorAll('.delete-row-btn')
            };

            elements.deleteButtons.forEach(btn => {
                if (btn) btn.style.display = isVisible ? 'inline-flex' : 'none';
            });

            if (elements.deleteTableBtn) {
                elements.deleteTableBtn.style.display = isVisible ? 'block' : 'none';
            }

            elements.actionsColumn.forEach(col => {
                if (col) col.style.display = isVisible ? 'table-cell' : 'none';
            });

            elements.deleteRowBtns.forEach(btn => {
                if (btn) btn.style.display = isVisible ? 'inline-flex' : 'none';
            });

            localStorage.setItem('deleteButtonsVisible', isVisible);

            if (TableManager && typeof TableManager.renderRecords === 'function') {
                TableManager.renderRecords();
            }
        } catch (error) {
            console.warn('Failed to update delete buttons visibility:', error);
        }
    },

    showPanel() {
        const modal = document.getElementById('settingsModal');
        const backdrop = document.getElementById('modalBackdrop');
        if (modal && backdrop) {
            modal.style.display = 'block';
            backdrop.style.display = 'block';
        }
    },

    hidePanel() {
        const modal = document.getElementById('settingsModal');
        const backdrop = document.getElementById('modalBackdrop');
        if (modal && backdrop) {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
        }
    },

    syncInitialState() {
        try {
            const isDeleteEnabled = localStorage.getItem('deleteButtonsVisible') === 'true';
            const currentTheme = localStorage.getItem('selectedTheme') || 'light';

            const toggleSwitch = document.getElementById('octoberToggleDelete');
            if (toggleSwitch) {
                toggleSwitch.checked = isDeleteEnabled;
            }

            const themeSelect = document.getElementById('themeSelect');
            if (themeSelect) {
                themeSelect.value = currentTheme;
            }

            this.handleThemeChange(currentTheme);
        } catch (error) {
            console.error('Error syncing initial state:', error);
        }
    }
};

export const initializeToggleSwitch = () => {
    const toggleSwitch = document.getElementById('octoberToggleDelete');
    if (toggleSwitch) {
        toggleSwitch.checked = localStorage.getItem('deleteButtonsVisible') === 'true';
        
        toggleSwitch.addEventListener('change', function(e) {
            const isEnabled = e.target.checked;
            const deleteTableBtn = document.getElementById('octoberDeleteTable');
            
            if (deleteTableBtn) {
                deleteTableBtn.style.display = isEnabled ? 'block' : 'none';
            }
            
            localStorage.setItem('deleteButtonsVisible', isEnabled);
            
            if (window.TableManager) {
                window.TableManager.updateTableDisplay();
            }
        });

        toggleSwitch.dispatchEvent(new Event('change'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        SettingsManager.init();
    } catch (error) {
        console.error('Failed to initialize SettingsManager:', error);
    }
});