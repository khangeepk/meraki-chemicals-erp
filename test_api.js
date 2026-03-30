const axios = require('axios');

async function runTests() {
    process.env.NODE_ENV = 'test';
    try {
        console.log('Testing Purchasing API...');
        const pRes = await axios.post('http://localhost:3000/api/purchasing', {
            purch_date: '2026-03-30',
            prod_name: 'Acid 500',
            quantity: 10,
            prod_cost: 100, // 1000 total
            disc_availed: 50, // 950 amount
            carriage_offload_cost: 20, // 970 final
            payment_certified: 'true'
        });
        console.log('Purchasing Result:', pRes.data.data);
        if (pRes.data.data.final_cost !== '970.00') throw new Error("Math Error");

        console.log('Testing Sales API...');
        const sRes = await axios.post('http://localhost:3000/api/sales', {
            prod_id: 1,
            quantity: 5,
            disc_availed: 0,
            sold_amount: 1000, // 1000 gross
            payment_certified: 'true'
        });
        console.log('Sales Result:', sRes.data.sale);
        // Math: Net profit = gross(1000) - pCost(100*5) = 500
        if (sRes.data.sale.net_profit !== '500.00') throw new Error("Math Error in Sales");
        console.log('Testing Complete!');
    } catch (e) {
        console.error('Test Failed:', e.response?.data || e.message);
    }
}
runTests();
