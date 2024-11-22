import { AppState } from './appState.js';
import { FormManager } from "./formManager.js";
// formColorPicker.js
export const addFormColorPickers = () => {
    const style = document.createElement('style');
    style.textContent = `
        .form-color-pickers {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .color-picker-control {
            position: relative;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .color-picker-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-md);
            cursor: pointer;
            transition: all 0.2s ease;
            height: 36px;
            font-size: 14px;
        }

        .color-picker-button:hover {
            background: var(--bg-secondary);
        }

        .color-preview {
            width: 16px;
            height: 16px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
        }

        .color-picker-popup {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            padding: 16px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            width: 200px;
            z-index: 1000;
        }

        .color-presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
}

.preset-color {
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s;
}

.preset-color:hover {
    transform: scale(1.1);
}

.color-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.color-input {
    width: 100%;
    height: 40px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
}

.opacity-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.opacity-slider {
    width: 100%;
}

.color-preview-box {
    margin-top: 12px;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    text-align: center;
    background: var(--bg-secondary);
}
    `;
    document.head.appendChild(style);


    const presetColors = [
        '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
        '#ff00ff', '#00ffff', '#ffffff', '#000000',
        '#808080', '#ff8c00', '#800080', '#008080'
    ];

    const createColorPicker = (label, storagePrefix, applyColor) => {
        let isOpen = false;
        const container = document.createElement('div');
        container.className = 'color-picker-control';

        const button = document.createElement('button');
        button.className = 'color-picker-button';
        
        const preview = document.createElement('div');
        preview.className = 'color-preview';

        const buttonLabel = document.createElement('span');
        buttonLabel.textContent = label;

        button.append(preview, buttonLabel);

        const popup = document.createElement('div');
        popup.className = 'color-picker-popup';

        // Create controls first
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'color-input';
        colorInput.value = '#ffffff';

        const opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.className = 'opacity-slider';
        opacitySlider.min = '0';
        opacitySlider.max = '1';
        opacitySlider.step = '0.01';
        opacitySlider.value = '0.5';

        const opacityLabel = document.createElement('label');
        opacityLabel.textContent = 'Opacity: 0';

        const previewBox = document.createElement('div');
        previewBox.className = 'color-preview-box';
        previewBox.textContent = 'Preview';

        // Define updateColor function
        const updateColor = () => {
            const color = colorInput.value;
            const opacity = opacitySlider.value;
            opacityLabel.textContent = `Opacity: ${Number(opacity).toFixed(2)}`;

            const r = parseInt(color.slice(1,3), 16);
            const g = parseInt(color.slice(3,5), 16);
            const b = parseInt(color.slice(5,7), 16);
            const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            
            // Update previews
            preview.style.backgroundColor = rgba;
            previewBox.style.backgroundColor = rgba;
            
            // Update form elements if in form view
            if (AppState.viewMode === 'form') {
                applyColor(rgba, r, g, b, opacity);
            }
            
            // Save to localStorage
            localStorage.setItem(`${storagePrefix}Color`, rgba);
            localStorage.setItem(`${storagePrefix}ColorHex`, color);
            localStorage.setItem(`${storagePrefix}Opacity`, opacity);
        };

        // Create presets
        const presets = document.createElement('div');
        presets.className = 'color-presets';

        presetColors.forEach(color => {
            const preset = document.createElement('button');
            preset.className = 'preset-color';
            preset.style.backgroundColor = color;
            preset.onclick = () => {
                colorInput.value = color;
                updateColor();
            };
            presets.appendChild(preset);
        });

        // Assemble controls
        const controls = document.createElement('div');
        controls.className = 'color-controls';

        const opacityContainer = document.createElement('div');
        opacityContainer.className = 'opacity-container';
        opacityContainer.append(opacityLabel, opacitySlider);

        controls.append(colorInput, opacityContainer, previewBox);

        // Assemble popup
        popup.append(presets, controls);
        container.append(button, popup);

        // Add event listeners
        button.onclick = (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            popup.style.display = isOpen ? 'block' : 'none';
        };

        colorInput.addEventListener('input', updateColor);
        opacitySlider.addEventListener('input', updateColor);

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (isOpen && !container.contains(e.target)) {
                isOpen = false;
                popup.style.display = 'none';
            }
        });

        // Load saved color
        const savedColor = localStorage.getItem(`${storagePrefix}ColorHex`);
        const savedOpacity = localStorage.getItem(`${storagePrefix}Opacity`);
        if (savedColor) {
            colorInput.value = savedColor;
            opacitySlider.value = savedOpacity !== null ? savedOpacity : '0';
            updateColor();
        }

        return {
            container,
            updateColor,
            colorInput,
            opacitySlider
        };
    };
    const initializeColorPickers = () => {
        const navContainer = document.querySelector('.form-navigation');
        if (!navContainer) return;

        const pickerContainer = document.createElement('div');
        pickerContainer.className = 'form-color-pickers';

        // Background color picker
        const backgroundPicker = createColorPicker('Form Background', 'formBg', (rgba) => {
            const formContent = document.querySelector('.form-content');
            if (formContent) {
                formContent.style.backgroundColor = rgba;
            }
        });

        // Label/Form Group color picker
        const labelPicker = createColorPicker('Form Group Color', 'formLabel', (rgba, r, g, b, opacity) => {
            document.querySelectorAll('.form-group').forEach(group => {
                group.style.backgroundColor = rgba;
                group.style.borderColor = `rgba(${r}, ${g}, ${b}, ${Math.min(1, Number(opacity) + 0.2)})`;
            });
            document.querySelectorAll('.form-group label').forEach(label => {
                label.style.color = rgba;
            });
        });

        pickerContainer.append(backgroundPicker.container, labelPicker.container);
        navContainer.appendChild(pickerContainer);

        // Function to apply saved colors
        const applyStoredColors = () => {
            if (AppState.viewMode === 'form') {
                // Apply background color
                const bgColor = localStorage.getItem('formBgColorHex');
                const bgOpacity = localStorage.getItem('formBgOpacity');
                if (bgColor) {
                    backgroundPicker.colorInput.value = bgColor;
                    backgroundPicker.opacitySlider.value = bgOpacity || '1';
                    backgroundPicker.updateColor();
                }

                // Apply label/form group color
                const labelColor = localStorage.getItem('formLabelColorHex');
                const labelOpacity = localStorage.getItem('formLabelOpacity');
                if (labelColor) {
                    labelPicker.colorInput.value = labelColor;
                    labelPicker.opacitySlider.value = labelOpacity || '1';
                    labelPicker.updateColor();
                }
            }
        };

        // Apply colors on initialization
        applyStoredColors();

        // Watch for view mode changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'formView' && 
                    mutation.attributeName === 'style') {
                    applyStoredColors();
                }
            });
        });

        const formView = document.getElementById('formView');
        if (formView) {
            observer.observe(formView, { attributes: true });
        }

        // Watch for record changes
        FormManager.onRecordChange = applyStoredColors;
    };

   // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeColorPickers);
    } else {
        initializeColorPickers();
    }
};

export default addFormColorPickers;