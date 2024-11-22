// toolbar.js
import {DataManager} from './dataManager.js'

export const applyStyleToCells = (styleProperty, value) => {
    localStorage.setItem(`db4sql-${styleProperty}`, value);

    if (styleProperty === 'backgroundColor') {
        applyBackgroundColor(value);
    } else if (styleProperty === 'fontSize') {
        applyFontSize(value);
    } else {
        applyStyleToElements('#dataTable td, #dataTable th', styleProperty, value);
        applyStyleToElements('#recordForm input, #recordForm textarea, #recordForm select', styleProperty, value);
    }
};

// Style application helpers
const applyBackgroundColor = (color) => {
    const tableRows = document.querySelectorAll('#dataTable tbody tr');
    const lightColor = lightenColor(color, 90);

    tableRows.forEach((row, index) => {
        row.style.backgroundColor = index % 2 === 0 ? lightColor : '#ffffff';
    });
};

const applyFontSize = (size) => {
    const elements = document.querySelectorAll('#dataTable td, #dataTable th, #recordForm input, #recordForm textarea, #recordForm select');
    elements.forEach(element => {
        element.style.fontSize = `${size}px`;
        const padding = Math.max(8, Math.floor(parseInt(size) * 0.5));
        element.style.padding = `${padding}px`;
    });
};

const applyStyleToElements = (selector, property, value) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        element.style[property] = value;
    });
};

// Color utilities
const lightenColor = (color, percent) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    const rgb = ctx.fillStyle.match(/\d+/g).map(Number);
    
    return `rgba(${rgb.map(c => {
        const lightened = c + ((255 - c) * (percent / 100));
        return Math.min(255, Math.round(lightened));
    }).join(', ')}, 0.3)`;
};

const hexToRgb = (hex) => {
    if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) return null;
    const bigint = parseInt(hex.substring(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
};

const hexToRgba = (hex, alpha = 1) => {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : null;
};

const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
};

// State management
let colorPickerState = {
    currentColor: '#000000',
    currentAlpha: 1,
    basicColors: [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000',
        '#808000', '#008000', '#800080', '#008080', '#000080'
    ]
};

// Initialize font size control
const initializeFontSizeControl = (toolbar) => {
    const fontSizeControl = document.createElement('div');
    fontSizeControl.className = 'font-size-control';

    const label = document.createElement('label');
    label.textContent = 'Font Size:';
    label.htmlFor = 'fontSizeRange';

    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.id = 'fontSizeRange';
    rangeInput.min = '12';
    rangeInput.max = '48';
    rangeInput.value = localStorage.getItem('appFontSize') || '18';

    const sizeDisplay = document.createElement('span');
    sizeDisplay.className = 'font-size-display';
    sizeDisplay.textContent = `${rangeInput.value}px`;

    rangeInput.addEventListener('input', (e) => {
        const size = e.target.value;
        sizeDisplay.textContent = `${size}px`;
        applyStyleToCells('fontSize', size);
        localStorage.setItem('appFontSize', size);
    });

    fontSizeControl.append(label, rangeInput, sizeDisplay);

    const searchContainer = toolbar.querySelector('.search-container');
    if (searchContainer) {
        toolbar.insertBefore(fontSizeControl, searchContainer);
    } else {
        toolbar.appendChild(fontSizeControl);
    }
};

// Color picker setup
const setupColorPicker = () => {
    const colorPickerModal = document.getElementById('db4sql-colorPickerModal');
    const basicColorsContainer = document.querySelector('.db4sql-basic-colors');

    if (basicColorsContainer) {
        basicColorsContainer.innerHTML = '';
        colorPickerState.basicColors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'db4sql-basic-color';
            colorDiv.style.backgroundColor = color;
            colorDiv.addEventListener('click', () => {
                updateColorInputs(color);
            });
            basicColorsContainer.appendChild(colorDiv);
        });
    }

    if (colorPickerModal) {
        colorPickerModal.addEventListener('click', (e) => {
            if (e.target.matches('#db4sql-closeColorPicker, #db4sql-colorPickerCancelBtn')) {
                hideColorPicker();
            } else if (e.target.matches('#db4sql-colorPickerOkBtn')) {
                applySelectedColor();
            }
        });
    }
};

const updateColorInputs = (color) => {
    const elements = {
        spectrum: document.getElementById('db4sql-colorSpectrumInput'),
        hex: document.getElementById('db4sql-hexInput'),
        red: document.getElementById('db4sql-redInput'),
        green: document.getElementById('db4sql-greenInput'),
        blue: document.getElementById('db4sql-blueInput'),
        alpha: document.getElementById('db4sql-alphaInput')
    };

    const rgb = hexToRgb(color);
    if (rgb) {
        if (elements.spectrum) elements.spectrum.value = color;
        if (elements.hex) elements.hex.value = color;
        if (elements.red) elements.red.value = rgb.r;
        if (elements.green) elements.green.value = rgb.g;
        if (elements.blue) elements.blue.value = rgb.b;
        if (elements.alpha) elements.alpha.value = colorPickerState.currentAlpha;
    }
};

const hideColorPicker = () => {
    const modal = document.getElementById('db4sql-colorPickerModal');
    if (modal) modal.style.display = 'none';
};

const applySelectedColor = () => {
    const hexInput = document.getElementById('db4sql-hexInput');
    const alphaInput = document.getElementById('db4sql-alphaInput');
    
    if (hexInput && alphaInput) {
        const color = hexInput.value;
        const alpha = parseFloat(alphaInput.value);
        const rgbaColor = hexToRgba(color, alpha);

        if (rgbaColor) {
            applyStyleToCells('backgroundColor', rgbaColor);
            localStorage.setItem('db4sql-backgroundColor', rgbaColor);
        }
    }
    
    hideColorPicker();
};

// Main initialization
export const initializeToolbar = () => {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    // Initialize font size control
    initializeFontSizeControl(toolbar);

    const elements = {
        boldBtn: document.getElementById('db4sql-boldBtn'),
        italicBtn: document.getElementById('db4sql-italicBtn'),
        underlineBtn: document.getElementById('db4sql-underlineBtn'),
        colorPickerBtn: document.getElementById('db4sql-colorPickerBtn'),
        alignLeftBtn: document.getElementById('db4sql-alignLeftBtn'),
        alignCenterBtn: document.getElementById('db4sql-alignCenterBtn'),
        alignRightBtn: document.getElementById('db4sql-alignRightBtn')
    };

    // Style button handlers
    elements.boldBtn?.addEventListener('click', () => {
        const isActive = elements.boldBtn.classList.toggle('active');
        applyStyleToCells('fontWeight', isActive ? 'bold' : 'normal');
    });

    elements.italicBtn?.addEventListener('click', () => {
        const isActive = elements.italicBtn.classList.toggle('active');
        applyStyleToCells('fontStyle', isActive ? 'italic' : 'normal');
    });

    elements.underlineBtn?.addEventListener('click', () => {
        const isActive = elements.underlineBtn.classList.toggle('active');
        applyStyleToCells('textDecoration', isActive ? 'underline' : 'none');
    });

    // Alignment handlers
    elements.alignLeftBtn?.addEventListener('click', () => {
        applyStyleToCells('textAlign', 'left');
    });

    elements.alignCenterBtn?.addEventListener('click', () => {
        applyStyleToCells('textAlign', 'center');
    });

    elements.alignRightBtn?.addEventListener('click', () => {
        applyStyleToCells('textAlign', 'right');
    });

    // Color picker handler
    elements.colorPickerBtn?.addEventListener('click', () => {
        const modal = document.getElementById('db4sql-colorPickerModal');
        if (modal) modal.style.display = 'block';
    });

    // Initialize color picker
    setupColorPicker();

    // Initialize spectrum input handler
    const spectrumInput = document.getElementById('db4sql-colorSpectrumInput');
    spectrumInput?.addEventListener('input', (e) => {
        updateColorInputs(e.target.value);
    });

    // Initialize RGB input handlers
    ['red', 'green', 'blue', 'alpha'].forEach(color => {
        const input = document.getElementById(`db4sql-${color}Input`);
        input?.addEventListener('input', updateColorFromRGBInputs);
    });

    // Initialize hex input handler
    const hexInput = document.getElementById('db4sql-hexInput');
    hexInput?.addEventListener('input', () => {
        const color = hexInput.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            updateColorInputs(color);
        }
    });

    // Load saved styles
    loadStylesFromLocalStorage();
};

// Load saved styles
const loadStylesFromLocalStorage = () => {
    const styles = {
        fontWeight: localStorage.getItem('db4sql-fontWeight') || 'normal',
        fontStyle: localStorage.getItem('db4sql-fontStyle') || 'normal',
        textDecoration: localStorage.getItem('db4sql-textDecoration') || 'none',
        textAlign: localStorage.getItem('db4sql-textAlign') || 'left',
        backgroundColor: localStorage.getItem('db4sql-backgroundColor') || '',
        fontSize: localStorage.getItem('appFontSize') || '18'
    };

    // Apply saved styles
    Object.entries(styles).forEach(([property, value]) => {
        if (value) {
            if (property === 'fontSize') {
                applyStyleToCells(property, value);
            } else {
                applyStyleToCells(property, value);
            }
        }
    });

    // Update button states
    const elements = {
        boldBtn: document.getElementById('db4sql-boldBtn'),
        italicBtn: document.getElementById('db4sql-italicBtn'),
        underlineBtn: document.getElementById('db4sql-underlineBtn')
    };

    if (styles.fontWeight === 'bold') elements.boldBtn?.classList.add('active');
    if (styles.fontStyle === 'italic') elements.italicBtn?.classList.add('active');
    if (styles.textDecoration === 'underline') elements.underlineBtn?.classList.add('active');
};

// Update color from RGB inputs
const updateColorFromRGBInputs = () => {
    const elements = {
        red: document.getElementById('db4sql-redInput'),
        green: document.getElementById('db4sql-greenInput'),
        blue: document.getElementById('db4sql-blueInput'),
        alpha: document.getElementById('db4sql-alphaInput'),
        hex: document.getElementById('db4sql-hexInput'),
        spectrum: document.getElementById('db4sql-colorSpectrumInput')
    };

    const r = parseInt(elements.red?.value) || 0;
    const g = parseInt(elements.green?.value) || 0;
    const b = parseInt(elements.blue?.value) || 0;
    const a = parseFloat(elements.alpha?.value) || 1;

    const color = rgbToHex(r, g, b);
    if (elements.hex) elements.hex.value = color;
    if (elements.spectrum) elements.spectrum.value = color;
    colorPickerState.currentAlpha = a;
};
const getToolbarState = () => {
    return {
        colorPickerState: {
            currentColor: colorPickerState.currentColor,
            currentAlpha: colorPickerState.currentAlpha,
            basicColors: [...colorPickerState.basicColors]
        },
        styles: {
            fontWeight: localStorage.getItem('db4sql-fontWeight') || 'normal',
            fontStyle: localStorage.getItem('db4sql-fontStyle') || 'normal',
            textDecoration: localStorage.getItem('db4sql-textDecoration') || 'none',
            textAlign: localStorage.getItem('db4sql-textAlign') || 'left',
            backgroundColor: localStorage.getItem('db4sql-backgroundColor') || '',
            fontSize: localStorage.getItem('appFontSize') || '18'
        },
        elements: {
            boldBtn: document.getElementById('db4sql-boldBtn'),
            italicBtn: document.getElementById('db4sql-italicBtn'),
            underlineBtn: document.getElementById('db4sql-underlineBtn'),
            colorPickerBtn: document.getElementById('db4sql-colorPickerBtn'),
            alignLeftBtn: document.getElementById('db4sql-alignLeftBtn'),
            alignCenterBtn: document.getElementById('db4sql-alignCenterBtn'),
            alignRightBtn: document.getElementById('db4sql-alignRightBtn'),
            fontSizeInput: document.getElementById('db4sql-fontSizeInput')
        }
    };
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeToolbar);

// Single export statement at the end
export {
   
  
    getToolbarState
};
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeToolbar);