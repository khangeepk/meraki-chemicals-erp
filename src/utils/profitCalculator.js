const Decimal = require('decimal.js');

function calculateProfitDistribution(netProfitInput) {
    const netProfit = new Decimal(netProfitInput);
    
    // As per user strict requirement: 
    // Sami/Qaiser: Base is 55%. Charity is 2%. Final showing profit = 53%.
    // Saif Traders: Base is 45%. Charity is 1%. Final showing profit = 44%.
    // Deduction Column = Total 3% charity.
    
    const samiFinal = netProfit.times(0.53);
    const saifFinal = netProfit.times(0.44);
    const charity = netProfit.times(0.03);

    return {
        sami_profit: samiFinal.toFixed(2),
        saif_profit: saifFinal.toFixed(2),
        charity: charity.toFixed(2),
        total_verify: samiFinal.plus(saifFinal).plus(charity).toFixed(2) // verification check
    };
}

module.exports = { calculateProfitDistribution };
