// 数値を指定された桁数でフォーマット
function formatNumber(value, decimalPlaces) {
    return value.toFixed(decimalPlaces);
}

/*
// 数値を工学形式でフォーマット (Decimal.jsが必要)
function formatEngineering(value, decimalPlaces) {
    return new Decimal(value).toEngineering(decimalPlaces);
}
*/

// 2つの日付間の日数を計算
function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}

// 度をラジアンに変換
function degreesToRadians(degrees) {
    return new Decimal(degrees).times(Math.PI).dividedBy(180);
}

// ラジアンを度に変換
function radiansToDegrees(radians) {
    return new Decimal(radians).times(180).dividedBy(Math.PI);
}

// 階乗を計算
function factorial(n) {
    let result = new Decimal(1);
    for (let i = 2; i <= n; i++) {
        result = result.times(i);
    }
    return result;
}

// 順列を計算 (nPr)
function permutation(n, r) {
    if (n < r) return new Decimal(0);
    return factorial(n).dividedBy(factorial(n - r));
}

// 組み合わせを計算 (nCr)
function combination(n, r) {
    if (n < r) return new Decimal(0);
    return factorial(n).dividedBy(factorial(r).times(factorial(n - r)));
}

// Make available globally
window.formatNumber = formatNumber;
// window.formatEngineering = formatEngineering;
window.daysBetween = daysBetween;
window.degreesToRadians = degreesToRadians;
window.radiansToDegrees = radiansToDegrees;
window.factorial = factorial;
window.permutation = permutation;
window.combination = combination; 