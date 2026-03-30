const request = require('supertest');
const app = require('../src/app');
const { calculateProfitDistribution } = require('../src/utils/profitCalculator');

describe('Part 2 Backend Logic Tests', () => {

    describe('Step 1: Inward API', () => {
        it('throws 400 Bad Request if missing actual_cost, carriage_cost, offloading_cost', async () => {
            const res = await request(app).post('/api/inward').send({
                product_id: 1,
                vendor_id: 2,
                qty_received: 100
                // Missing cost parameters
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/Missing required/i);
        });

        it('successfully calculates Landed Cost when fields are present', async () => {
            const res = await request(app).post('/api/inward').send({
                product_id: 1, vendor_id: 2, qty_received: 100,
                // land cost logic test: 15000 + 1000 + 500 = 16500 for 100.
                actual_cost: 15000, carriage_cost: 1000, offloading_cost: 500
            });
            // since db is mocked via NODE_ENV='test', it handles this logic
            expect(res.statusCode).toBe(201);
            expect(res.body.data.total_landed_cost).toBe(16500);
            expect(res.body.data.landed_cost_per_unit).toBe(165);
        });
    });

    describe('Step 3: EXACT Mathematical Profit Distribution', () => {
        it('calculates strictly according to the defined percentages', () => {
            // Sami & Qaiser: 43% equity, 2% charity
            // Saif Traders: 54% equity, 1% charity

            const netProfit = 10000;
            const dist = calculateProfitDistribution(netProfit);

            // Using Exact math validation
            expect(dist.sami_equity).toBe(4300); // 43%
            expect(dist.sami_charity).toBe(200);   // 2%
            expect(dist.saif_equity).toBe(5400);  // 54%
            expect(dist.saif_charity).toBe(100);   // 1%
        });

        it('handles specific trailing fractions perfectly without precision errors', () => {
            const netProfit = 13579.5;
            const dist = calculateProfitDistribution(netProfit);

            expect(dist.sami_equity).toBeCloseTo(13579.5 * 0.43, 2);
            expect(dist.saif_charity).toBeCloseTo(13579.5 * 0.01, 2);
        });
    });

    describe('Step 2 & 4: Sales Processing API & Multer', () => {
        // Without an actual file system, multer intercepts but fails if no file or boundary is passed without multi-part.
        // Supertest allows file attachments
        it('Runs sales processing logic and calculates strict transaction logic', async () => {
            const res = await request(app)
                .post('/api/sales')
                .field('batch_id', 1)
                .field('qty_sold', 50)
                .field('selling_price', 15000) // Total Revenue for 50 pieces is 15000. 
                // Landed cost was Mocked in db intercept as 100 per unit.
                // Revenue: 15000. COGS: 5000. Net Profit = 10000.
                .attach('payment_receipt', Buffer.from('test-image-content'), 'receipt.jpg');
            
            expect(res.statusCode).toBe(201);
            expect(res.body.financials.costOfGoodsSold).toBe(5000);
            expect(res.body.financials.revenue).toBe(15000);
            expect(res.body.financials.netProfit).toBe(10000);
            // Strict distribution validation
            expect(res.body.financials.distribution.sami_equity).toBe(4300);
            expect(res.body.financials.distribution.saif_charity).toBe(100);
            expect(res.body.sale.payment_receipt_url).toContain('/uploads/payment_receipt');
        });
    });
});
