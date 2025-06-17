import { CapitalAccumulation } from './capital-accumulation.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ca-form');
    if (!form) return;

    let caChart = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const reinvestmentRate = parseFloat(document.getElementById('reinvestment-rate').value);
        const safetyRate = parseFloat(document.getElementById('safety-rate').value);
        const totalInvestment = parseFloat(document.getElementById('total-investment').value);
        const years = parseInt(document.getElementById('calculation-years').value, 10);

        const ca = new CapitalAccumulation();
        ca.setParameters(reinvestmentRate, safetyRate, totalInvestment, years);
        const results = ca.calculate();
        
        displaySummary(ca, results);
        displayTable(results);
        displayChart(results);
    });

    function displaySummary(ca, results) {
        const summaryContainer = document.getElementById('ca-summary');
        const roi = ca.calculateROI();
        const annualizedROI = ca.calculateAnnualizedROI();
        const irr = ca.calculateIRR();
        const payback = ca.calculatePaybackPeriod();
        const finalValue = results.length > 0 ? results[results.length - 1].totalValue : ca.totalInvestment;

        summaryContainer.innerHTML = `
            <h3>投資要約</h3>
            <p><span>初期投資額:</span> <span>¥${ca.totalInvestment.toNumber().toLocaleString('ja-JP')}</span></p>
            <p><span>最終総額:</span> <span>¥${finalValue.toNumber().toLocaleString('ja-JP')}</span></p>
            <p><span>総利回り (ROI):</span> <span>${roi.toFixed(2)}%</span></p>
            <p><span>年平均利回り:</span> <span>${annualizedROI.toFixed(2)}%</span></p>
            <p><span>内部収益率 (IRR):</span> <span>${irr ? irr.toFixed(2) : 'N/A'}%</span></p>
            <p><span>投資回収期間:</span> <span>${payback ? payback.toFixed(2) + '年' : '回収不能'}</span></p>
        `;
    }

    function displayTable(results) {
        const tableContainer = document.getElementById('ca-table-container');
        let tableHTML = `<table class="ca-table">
            <thead>
                <tr>
                    <th>年</th>
                    <th>投資額</th>
                    <th>資本蓄積額</th>
                    <th>総額</th>
                    <th>再投資額</th>
                    <th>安全額</th>
                </tr>
            </thead>
            <tbody>`;
        
        results.forEach(res => {
            tableHTML += `
                <tr>
                    <td>${res.year}</td>
                    <td>¥${res.investmentValue.toNumber().toLocaleString('ja-JP')}</td>
                    <td>¥${res.accumulatedCapital.toNumber().toLocaleString('ja-JP')}</td>
                    <td>¥${res.totalValue.toNumber().toLocaleString('ja-JP')}</td>
                    <td>¥${res.reinvestmentAmount.toNumber().toLocaleString('ja-JP')}</td>
                    <td>¥${res.safetyAmount.toNumber().toLocaleString('ja-JP')}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        tableContainer.innerHTML = tableHTML;
    }

    function displayChart(results) {
        const ctx = document.getElementById('ca-chart').getContext('2d');
        const labels = results.map(r => r.year);
        const totalValueData = results.map(r => r.totalValue.toNumber());
        const investmentValueData = results.map(r => r.investmentValue.toNumber());
        const accumulatedCapitalData = results.map(r => r.accumulatedCapital.toNumber());

        if (caChart) {
            caChart.destroy();
        }

        caChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '総額',
                        data: totalValueData,
                        borderColor: '#4da3ff',
                        backgroundColor: 'rgba(77, 163, 255, 0.2)',
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: '投資額',
                        data: investmentValueData,
                        borderColor: '#ffb347',
                        backgroundColor: 'rgba(255, 179, 71, 0.2)',
                        fill: false,
                        borderDash: [5, 5],
                        tension: 0.1
                    },
                    {
                        label: '資本蓄積額',
                        data: accumulatedCapitalData,
                        borderColor: '#89cff0',
                        backgroundColor: 'rgba(137, 207, 240, 0.2)',
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value, index, values) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Trigger calculation on initial load
    form.dispatchEvent(new Event('submit'));
}); 