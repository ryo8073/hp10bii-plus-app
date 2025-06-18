// HP10BII+ 電卓の計算エンジン
// 高精度計算と状態管理を提供

// Decimal.jsはグローバルにロードされるため、直接 Decimal オブジェクトを使用
Decimal.set({ precision: 12, rounding: Decimal.ROUND_HALF_UP });

class CalculatorEngine {
  constructor() {
    this.memory = new MemoryManager();
    this.clearAll();
    this.currentInput = '0'; // Per real calc behavior
    this.updateDisplay();
  }

  // Clears the current input and resets operator state
  clear() {
    this.currentInput = '0';
    this.operator = null;
    this.previousInput = null;
    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  // Resets the entire calculator to its default state
  clearAll() {
    this.clear();
    this.tvmValues = {
      N: null,      // Number of periods
      I_YR: null, // Interest per year
      PV: null,     // Present Value
      PMT: null,    // Payment
      FV: null,     // Future Value
      P_YR: 12,     // Periods per year
      isBeginningMode: false
    };
    this.memory.clearAll(); // Assuming memory manager has a full clear
    this.decimalPlaces = 2; // Default decimal places
    this.shiftMode = null; // 'orange', 'blue', or null
    this.isWaitingForSequencedInput = null; // For multi-key functions like STO/RCL
    this.updateDisplay();
  }

  setDecimalPlaces(places) {
    const p = parseInt(places, 10);
    if (!isNaN(p) && p >= 0 && p <= 9) {
      this.decimalPlaces = p;
      this.isEnteringInput = false; // To show the formatted number right away
    }
    this.currentInput = '0'; // Per real calc behavior
    this.updateDisplay();
  }

  inputDigit(digit) {
    if (this.isWaitingForSequencedInput) {
      this.handleSequencedInput(digit);
      return;
    }

    // If we are not in entry mode OR we are waiting for a second operand, start a new number.
    if (!this.isEnteringInput || this.waitingForSecondOperand) {
      this.currentInput = digit;
    } else {
      // Otherwise, append to the current number.
      this.currentInput = (this.currentInput === '0') ? digit : this.currentInput + digit;
    }

    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.isWaitingForSequencedInput) return;

    // If starting a new number after an op, or not in entry, start with "0."
    if (!this.isEnteringInput || this.waitingForSecondOperand) {
        this.currentInput = '0.';
    } else if (!this.currentInput.includes('.')) {
        // otherwise, append if no decimal yet
        this.currentInput += '.';
    }
    
    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  changeSign() {
    if (this.currentInput !== '0' && this.currentInput !== 'Error') {
      this.currentInput = (parseFloat(this.currentInput) * -1).toString();
    }
    this.updateDisplay();
  }

  setOperator(op) {
    if (this.currentInput === 'Error') return;
    if (this.operator && !this.waitingForSecondOperand) {
      this.calculate();
    }
    this.previousInput = parseFloat(this.currentInput);
    this.operator = op;
    this.waitingForSecondOperand = true;
    this.isEnteringInput = false; // FINISH number entry, allow formatting
  }

  calculate() {
    if (this.operator && this.previousInput !== null) {
      const current = parseFloat(this.currentInput);
      let result = 0;
      switch (this.operator) {
        case 'ADD': result = this.previousInput + current; break;
        case 'SUBTRACT': result = this.previousInput - current; break;
        case 'MULTIPLY': result = this.previousInput * current; break;
        case 'DIVIDE': result = this.previousInput / current; break;
      }
      this.currentInput = result.toString();
      this.operator = null;
      this.previousInput = null;
      this.isEnteringInput = false;
    }
    this.updateDisplay();
  }

  setShiftMode(mode) {
    // Toggle off if the same shift key is pressed again
    if (this.shiftMode === mode) {
      this.shiftMode = null;
    } else {
      this.shiftMode = mode;
    }
  }

  // --- Sequenced Inputs (like STO 1, RCL 2, DISP 4) ---
  startSequencedInput(sequenceType) {
    this.isWaitingForSequencedInput = sequenceType;
    // Maybe update display to show "STO" or "RCL" prompt
  }

  handleSequencedInput(digit) {
    switch (this.isWaitingForSequencedInput) {
      case 'STO':
        this.store(digit);
        break;
      case 'RCL':
        this.recall(digit);
        break;
      case 'DISP':
        this.setDecimalPlaces(digit);
        break;
    }
    this.isWaitingForSequencedInput = null;
    // Don't reset shift mode here, main.js will do it
  }

  // --- TVM Functions ---
  setTVMValue(key, value = null) {
    const val = value !== null ? value : parseFloat(this.currentInput);
    
    if (key.toUpperCase() === 'P_YR') {
      if (val > 0) this.tvmValues.P_YR = val;
    } else if (this.tvmValues.hasOwnProperty(key.toUpperCase())) {
      this.tvmValues[key.toUpperCase()] = val;
    } else if (this.tvmValues.hasOwnProperty(key)) {
      // Fallback for older key names
      this.tvmValues[key] = val;
    }
    
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  calculateTVM(keyToCalculate) {
    const key = keyToCalculate.toUpperCase();
    try {
      const result = calculateTVM(
        this.tvmValues.I_YR,
        this.tvmValues.N,
        this.tvmValues.PMT,
        this.tvmValues.PV,
        this.tvmValues.FV,
        key,
        this.tvmValues.P_YR,
        this.tvmValues.isBeginningMode
      );
      this.currentInput = result.toString();
      this.tvmValues[key] = result;
    } catch(error) {
      this.currentInput = "Error";
    }
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  // Placeholder for Amortization
  calculateAmortization() {
    console.log("Amortization calculation triggered.");
    this.currentInput = "AMORT";
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  // --- Memory Functions ---
  store(register) {
    const r = parseInt(register, 10);
    if (!isNaN(r) && r >= 0 && r <= 9) {
      this.memory.store(r, parseFloat(this.currentInput));
      this.isEnteringInput = false; // After storing, new input can start
    }
    this.updateDisplay();
  }

  recall(register) {
    const r = parseInt(register, 10);
    if (!isNaN(r) && r >= 0 && r <= 9) {
      const value = this.memory.recall(r);
      if (value !== null) {
        this.currentInput = value.toString();
        this.isEnteringInput = false;
      }
    }
    this.updateDisplay();
  }

  updateDisplay() {
    // Format the number for display based on decimalPlaces
    // But keep the internal value as a full-precision string
    if (this.isEnteringInput) {
      this.display = this.currentInput;
    } else {
      const num = parseFloat(this.currentInput);
      if (!isNaN(num)) {
        this.display = formatNumber(num, this.decimalPlaces);
      } else {
        this.display = this.currentInput; // Display error messages etc.
      }
    }
  }

  get displayValue() {
    return this.display;
  }

  backspace() {
    if (this.currentInput === "Error") return;
    if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
    } else {
        this.currentInput = '0';
    }
    // After backspace, we are definitely in input mode.
    this.isEnteringInput = true;
    this.updateDisplay();
  }
}

// Make available globally
window.CalculatorEngine = CalculatorEngine;
