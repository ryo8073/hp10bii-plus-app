// No imports needed, all classes/functions are global

document.addEventListener('DOMContentLoaded', () => {

    // --- Tab Switching Logic ---
    function showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Deactivate all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Show the selected tab content and activate the button
        document.getElementById(`${tabName}-content`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    // --- Tab Event Listeners ---
    document.getElementById('tab-calculator').addEventListener('click', () => showTab('calculator'));
    document.getElementById('tab-capital-accumulation').addEventListener('click', () => showTab('capital-accumulation'));
    
    // Dark mode toggle (simple version based on system preference)
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    const darkModeMatcher = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeMatcher.matches) {
        applyTheme('dark');
    }

    darkModeMatcher.addEventListener('change', e => {
        const newColorScheme = e.matches ? 'dark' : 'light';
        applyTheme(newColorScheme);
    });

    // --- Calculator Logic ---
    const engine = new CalculatorEngine();
    const display = document.getElementById('display');
    const shiftStatus = document.getElementById('shift-status');
    const keysGrid = document.querySelector('.keys-grid');
    const pendStatus = document.getElementById('pend-status');

    // --- Key Highlighting ---
    function flashKey(keyToFlash) {
        const keyElement = keysGrid.querySelector(`.key[data-key="${keyToFlash}"]`);
        if (keyElement) {
            keyElement.classList.add('key-active');
            setTimeout(() => {
                keyElement.classList.remove('key-active');
            }, 150);
        }
    }
    
    // Dynamically create shift text on keys
    keysGrid.querySelectorAll('.key').forEach(keyElement => {
        const orangeShiftText = keyElement.dataset.shiftOrange;
        const blueShiftText = keyElement.dataset.shiftBlue;

        if (orangeShiftText) {
            const shiftSpan = document.createElement('span');
            shiftSpan.className = 'shift-orange';
            shiftSpan.textContent = orangeShiftText;
            keyElement.appendChild(shiftSpan);
        }
        if (blueShiftText) {
            const shiftSpan = document.createElement('span');
            shiftSpan.className = 'shift-blue';
            shiftSpan.textContent = blueShiftText;
            keyElement.appendChild(shiftSpan);
        }
    });

    const updateDisplay = () => {
        display.textContent = engine.display;
        // Update shift status display
        if (engine.shiftMode === 'orange') {
            shiftStatus.textContent = '↓';
        } else if (engine.shiftMode === 'blue') {
            shiftStatus.textContent = '↑';
        } else {
            shiftStatus.textContent = '';
        }
        // Update PEND status
        if (engine.waitingForSecondOperand) {
            pendStatus.textContent = 'PEND';
        } else {
            pendStatus.textContent = '';
        }
    };

    keysGrid.addEventListener('click', (event) => {
        const keyElement = event.target.closest('.key');
        if (!keyElement) return; // If the click was not on a key or inside a key

        const key = keyElement.dataset.key;
        flashKey(key); // Flash the key on click

        const orangeShifted = engine.shiftMode === 'orange';
        const blueShifted = engine.shiftMode === 'blue';

        // Check for sequenced input first
        if (engine.isWaitingForSequencedInput && !isNaN(parseInt(key, 10))) {
            engine.handleSequencedInput(key);
        } else {
             // Regular key handling
            switch (key) {
                // --- Number Inputs ---
                case '0': case '1': case '2': case '3': case '4': 
                case '5': case '6': case '7': case '8': case '9':
                    engine.inputDigit(key);
                    break;
                case '.':
                    engine.inputDecimal();
                    break;

                // --- Operators ---
                case 'ADD': case 'SUBTRACT': case 'MULTIPLY': case 'DIVIDE':
                    engine.setOperator(key);
                    break;
                case '=':
                    if (orangeShifted) {
                        engine.startSequencedInput('DISP');
                    } else {
                        engine.calculate();
                    }
                    break;

                // --- Basic Functions ---
                case 'C':
                    if (orangeShifted) {
                        engine.clearAll();
                    } else {
                        engine.clear();
                    }
                    break;
                case 'BACKSPACE':
                    engine.backspace();
                    break;
                case '+/-':
                    engine.changeSign();
                    break;
                
                // --- Shift Keys ---
                case 'SHIFT_ORANGE':
                    engine.setShiftMode('orange');
                    break;
                case 'SHIFT_BLUE':
                    engine.setShiftMode('blue');
                    break;

                // --- Memory Functions ---
                case 'RCL':
                     if (orangeShifted) {
                        engine.startSequencedInput('STO');
                    } else {
                        engine.startSequencedInput('RCL');
                    }
                    break;

                // --- TVM Functions ---
                case 'N':
                case 'I/YR':
                case 'PV':
                case 'PMT':
                case 'FV':
                    if (orangeShifted) {
                        engine.handleShiftedTVM(key);
                    } else {
                        // If user is typing, set the value. Otherwise, compute it.
                        if (engine.isEnteringInput) {
                            engine.setTVMValue(key);
                        } else {
                            engine.calculateTVM(key);
                        }
                    }
                    break;

                default:
                    console.log('Unhandled key:', key, 'Shift:', engine.shiftMode);
                    break;
            }
        }

        // After most operations, reset shift mode unless it's a dedicated shift key
        // or a sequence has been started
        if (key !== 'SHIFT_ORANGE' && key !== 'SHIFT_BLUE' && !engine.isWaitingForSequencedInput) {
             if (engine.shiftMode) {
                engine.setShiftMode(null);
            }
        }
        
        updateDisplay();
    });

    // --- Keyboard Input Support ---
    document.addEventListener('keydown', (event) => {
        // Prevent handling keyboard events if the user is typing in an input field
        if (event.target.tagName === 'INPUT') {
            return;
        }

        let key = event.key;
        let code = event.code;
        let handled = true;

        const keyMap = {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
            'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3', 'Numpad4': '4', 'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9',
            '.': '.', 'NumpadDecimal': '.',
            '+': 'ADD', 'NumpadAdd': 'ADD',
            '-': 'SUBTRACT', 'NumpadSubtract': 'SUBTRACT',
            '*': 'MULTIPLY', 'NumpadMultiply': 'MULTIPLY',
            '/': 'DIVIDE', 'NumpadDivide': 'DIVIDE',
            'Enter': '=', 'NumpadEnter': '=', '=': '=',
            'Backspace': 'BACKSPACE',
            'Escape': 'C'
        };

        const dataKey = keyMap[event.key] || keyMap[event.code];

        if (!dataKey) return; // Do nothing if the key isn't mapped

        flashKey(dataKey); // Flash the corresponding key
        
        if ((key >= '0' && key <= '9') || (code.startsWith('Numpad') && !isNaN(parseInt(key, 10)))) {
            engine.inputDigit(key);
        } else if (key === '.' || code === 'NumpadDecimal') {
            engine.inputDecimal();
        } else if (key === '+' || code === 'NumpadAdd') {
            engine.setOperator('ADD');
        } else if (key === '-' || code === 'NumpadSubtract') {
            engine.setOperator('SUBTRACT');
        } else if (key === '*' || code === 'NumpadMultiply') {
            engine.setOperator('MULTIPLY');
        } else if (key === '/' || code === 'NumpadDivide') {
            engine.setOperator('DIVIDE');
        } else if (key === 'Enter' || key === '=' || code === 'NumpadEnter') {
            engine.calculate();
        } else if (key === 'Backspace') {
            engine.backspace();
        } else if (key === 'Escape') {
            engine.clear();
        } else {
            handled = false;
        }

        if (handled) {
            event.preventDefault(); // Prevent default browser action (e.g., '/' for quick find)
            updateDisplay();
        }
    });

    // Initial Display Update
    updateDisplay();
}); 