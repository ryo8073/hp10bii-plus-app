import { CalculatorEngine } from './calculator-engine.js';

function showTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabName + '-content').classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// Dark mode toggle (simple version based on system preference)
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const newColorScheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newColorScheme);
});

document.addEventListener('DOMContentLoaded', () => {
    const engine = new CalculatorEngine();
    const display = document.getElementById('display');
    const shiftStatus = document.getElementById('shift-status');
    const keysGrid = document.querySelector('.keys-grid');

    const updateDisplay = () => {
        display.textContent = engine.display;
        // Update shift status display
        if (engine.shiftMode === 'up') {
            shiftStatus.textContent = '↑';
        } else if (engine.shiftMode === 'down') {
            shiftStatus.textContent = '↓';
        } else {
            shiftStatus.textContent = '';
        }
    };

    keysGrid.addEventListener('click', (event) => {
        const keyElement = event.target.closest('.key');
        if (!keyElement) return;

        const key = keyElement.dataset.key;

        switch (key) {
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
                engine.inputDigit(key);
                break;
            case 'DECIMAL':
                engine.inputDecimal();
                break;
            case 'ADD':
                engine.setOperation('ADD');
                break;
            case 'SUBTRACT':
                engine.setOperation('SUBTRACT');
                break;
            case 'MULTIPLY':
                engine.setOperation('MULTIPLY');
                break;
            case 'DIVIDE':
                engine.setOperation('DIVIDE');
                break;
            case 'EQUALS':
                engine.equals();
                break;
            case 'C':
                engine.clear();
                break;
            case 'BACKSPACE':
                engine.backspace();
                break;
            case '+/-':
                engine.changeSign();
                break;
            case 'SHIFT_UP':
                engine.setShiftMode('up');
                break;
            case 'SHIFT_DOWN':
                engine.setShiftMode('down');
                break;
            // Add more cases for financial and other function keys
            case 'N':
            case 'I/YR':
            case 'PV':
            case 'PMT':
            case 'FV':
                if (engine.shiftMode === null) {
                    engine.setTVMValue(key);
                } else {
                    // Handle shifted functions for these keys
                    engine.calculateTVM(key);
                }
                break;
            default:
                // For unhandled keys, maybe log them
                console.log('Unhandled key:', key);
                break;
        }

        // After most operations, reset shift mode unless it's a dedicated shift key
        if (key !== 'SHIFT_UP' && key !== 'SHIFT_DOWN') {
             if (engine.shiftMode) {
                engine.setShiftMode(null);
            }
        }
        
        updateDisplay();
    });

    // Initial display update
    updateDisplay();
}); 