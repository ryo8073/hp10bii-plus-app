class MemoryManager {
    constructor() {
        this.clearAll();
    }

    clearAll() {
        this.registers = new Array(15).fill(null); // 15 memory registers
        this.cashFlows = []; // For CFj
    }

    store(register, value) {
        if (register >= 0 && register < this.registers.length) {
            this.registers[register] = value;
        }
    }

    recall(register) {
        if (register >= 0 && register < this.registers.length) {
            return this.registers[register];
        }
        return null;
    }

    storeCashFlow(value) {
        this.cashFlows.push(value);
    }

    getCashFlows() {
        return this.cashFlows;
    }

    clearCashFlows() {
        this.cashFlows = [];
    }
}

// Make available globally
window.MemoryManager = MemoryManager; 