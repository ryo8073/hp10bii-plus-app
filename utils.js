import { Decimal } from 'decimal.js';

export class Utils {
    // 数値を指定された桁数でフォーマット
    static formatNumber(value, decimalPlaces) {
        return value.toFixed(decimalPlaces);
    }

    // 数値を工学形式でフォーマット
    static formatEngineering(value, decimalPlaces) {
        return value.toEngineering(decimalPlaces);
    }

    // 2つの日付間の日数を計算
    static daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }

    // 度をラジアンに変換
    static degreesToRadians(degrees) {
        return new Decimal(degrees).times(Math.PI).dividedBy(180);
    }

    // ラジアンを度に変換
    static radiansToDegrees(radians) {
        return new Decimal(radians).times(180).dividedBy(Math.PI);
    }

    // 階乗を計算
    static factorial(n) {
        let result = new Decimal(1);
        for (let i = 2; i <= n; i++) {
            result = result.times(i);
        }
        return result;
    }

    // 順列を計算 (nPr)
    static permutation(n, r) {
        if (n < r) return new Decimal(0);
        return this.factorial(n).dividedBy(this.factorial(n - r));
    }

    // 組み合わせを計算 (nCr)
    static combination(n, r) {
        if (n < r) return new Decimal(0);
        return this.factorial(n).dividedBy(this.factorial(r).times(this.factorial(n - r)));
    }
} 