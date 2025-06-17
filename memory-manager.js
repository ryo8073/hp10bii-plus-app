import { Decimal } from 'decimal.js';

export class MemoryManager {
    constructor() {
        this.memory = new Decimal(0);
        this.registers = new Array(10).fill(new Decimal(0)); // R0-R9
    }

    // メインメモリに値を保存
    store(value) {
        this.memory = new Decimal(value);
    }

    // メインメモリから値を呼び出し
    recall() {
        return this.memory;
    }

    // メインメモリに値を加算
    addToMemory(value) {
        this.memory = this.memory.plus(new Decimal(value));
    }

    // メインメモリから値を減算
    subtractFromMemory(value) {
        this.memory = this.memory.minus(new Decimal(value));
    }

    // メインメモリをクリア
    clearMemory() {
        this.memory = new Decimal(0);
    }

    // 特定のレジスタに値を保存
    storeRegister(index, value) {
        if (index >= 0 && index < this.registers.length) {
            this.registers[index] = new Decimal(value);
        }
    }

    // 特定のレジスタから値を呼び出し
    recallRegister(index) {
        if (index >= 0 && index < this.registers.length) {
            return this.registers[index];
        }
        return new Decimal(0);
    }

    // すべてのレジスタをクリア
    clearAllRegisters() {
        this.registers.fill(new Decimal(0));
    }
} 