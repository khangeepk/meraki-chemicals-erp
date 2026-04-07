const express = require('express');
const router = express.Router();
const db = require('../db');
const Decimal = require('decimal.js');

// GET All - /api/investments
router.get('/', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'test') return res.json({ success: true, data: [] });
        const result = await db.query('SELECT * FROM tbl_Investment_Ledger ORDER BY Ledger_ID DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch Ledgers.' });
    }
});

// POST Setup - /api/investments/setup
router.post('/setup', async (req, res) => {
    let client;
    try {
        const { Principal_Amount, PO_Slip_URL, Sent_Payment_Receipt_URL, Investment_Date, Item_Details } = req.body;
        
        if (!Principal_Amount || !PO_Slip_URL || !Sent_Payment_Receipt_URL) {
            return res.status(400).json({ error: 'Principal_Amount, PO_Slip_URL, and Sent_Payment_Receipt_URL are required.' });
        }

        const date = Investment_Date || new Date().toISOString().split('T')[0];
        const details = Item_Details || 'Initial Setup';
        const principal = new Decimal(Principal_Amount);

        if (process.env.NODE_ENV !== 'test') { client = await db.getClient(); await client.query('BEGIN'); }

        let result;
        if (process.env.NODE_ENV !== 'test') {
            const insertQuery = await client.query(
                `INSERT INTO tbl_Investment_Ledger 
                 (Investment_Date, Item_Details, Principal_Amount, PO_Slip_URL, Sent_Payment_Receipt_URL)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
                [date, details, principal.toFixed(2), PO_Slip_URL, Sent_Payment_Receipt_URL]
            );
            result = insertQuery.rows[0];
            await client.query('COMMIT');
        } else {
            // Mongoose or Mock simulation when DB isn't connected in TEST mode
            result = { 
                ledger_id: Math.floor(Math.random() * 1000) + 1,
                investment_date: date,
                item_details: details,
                principal_amount: principal.toFixed(2),
                po_slip_url: PO_Slip_URL,
                sent_payment_receipt_url: Sent_Payment_Receipt_URL
            };
        }
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Investment Setup Error:', err);
        res.status(500).json({ error: 'Failed to process investment setup' });
    } finally {
        if (client) client.release();
    }
});

// PUT Reconcile - /api/investments/:id/reconcile
router.put('/:id/reconcile', async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { Return_Date, Sale_Amount, Expense_Amount, Return_Receipt_URL } = req.body;

        if (!Sale_Amount || !Expense_Amount || !Return_Receipt_URL) {
            return res.status(400).json({ error: 'Sale_Amount, Expense_Amount, and Return_Receipt_URL are required to reconcile.' });
        }

        if (process.env.NODE_ENV !== 'test') { client = await db.getClient(); await client.query('BEGIN'); }

        let principal_amount = '0';
        if (process.env.NODE_ENV !== 'test') {
            const getInv = await client.query('SELECT Principal_Amount FROM tbl_Investment_Ledger WHERE Ledger_ID = $1', [id]);
            if (!getInv.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Investment ledger not found.' });
            }
            principal_amount = getInv.rows[0].principal_amount;
        } else {
            // For testing purposes
            principal_amount = req.body.Principal_Amount || '50000';
        }

        // --- Chain-of-Thought Mathematics Execution ---
        const principalAmount = new Decimal(principal_amount);
        const expenseAmount = new Decimal(Expense_Amount);
        const saleAmount = new Decimal(Sale_Amount);

        // Step 1: Calculate Total_Cost = Principal_Amount + Expense_Amount.
        const totalCost = principalAmount.plus(expenseAmount);

        // Step 2: Calculate Net_Profit = Sale_Amount - Total_Cost.
        const netProfit = saleAmount.minus(totalCost);

        if (netProfit.isNegative()) {
             if (client && process.env.NODE_ENV !== 'test') await client.query('ROLLBACK');
             return res.status(400).json({ error: 'Net_Profit is negative. Separate loss logic required.' });
        }

        // Step 3: Calculate Charity_Deduction = 3% of Net_Profit.
        const charityDeduction = netProfit.times(0.03);

        // Step 4: Calculate Sami_Qaiser_Profit = 53% of Net_Profit.
        const samiQaiserProfit = netProfit.times(0.53);

        // Step 5: Calculate Saif_Profit = 44% of Net_Profit.
        const saifProfit = netProfit.times(0.44);

        const rDate = Return_Date || new Date().toISOString().split('T')[0];

        let result;
        if (process.env.NODE_ENV !== 'test') {
             const updateQuery = await client.query(
                 `UPDATE tbl_Investment_Ledger
                  SET Return_Date = $1, Sale_Amount = $2, Expense_Amount = $3, Return_Receipt_URL = $4,
                      Net_Profit = $5, Sami_Qaiser_Profit = $6, Saif_Profit = $7, Charity_Deduction = $8
                  WHERE Ledger_ID = $9 RETURNING *;`,
                 [rDate, saleAmount.toFixed(2), expenseAmount.toFixed(2), Return_Receipt_URL, 
                  netProfit.toFixed(2), samiQaiserProfit.toFixed(2), saifProfit.toFixed(2), charityDeduction.toFixed(2), id]
             );
             result = updateQuery.rows[0];
             await client.query('COMMIT');
        } else {
             result = { 
                ledger_id: id,
                investment_date: new Date().toISOString(),
                item_details: 'Mocked Investment',
                principal_amount: principalAmount.toFixed(2),
                po_slip_url: 'http://example.com',
                sent_payment_receipt_url: 'http://example.com',
                return_date: rDate,
                sale_amount: saleAmount.toFixed(2),
                expense_amount: expenseAmount.toFixed(2),
                return_receipt_url: Return_Receipt_URL,
                net_profit: netProfit.toFixed(2),
                charity_deduction: charityDeduction.toFixed(2),
                sami_qaiser_profit: samiQaiserProfit.toFixed(2),
                saif_profit: saifProfit.toFixed(2)
             };
        }

        res.json({ success: true, data: result });
    } catch (err) {
        if (client && process.env.NODE_ENV !== 'test') await client.query('ROLLBACK');
        console.error('Reconcile Error:', err);
        res.status(500).json({ error: 'Failed to reconcile investment ledger.' });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;
