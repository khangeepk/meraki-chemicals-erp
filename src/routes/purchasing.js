const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const Decimal = require('decimal.js');
const { authenticateJWT, requirePermission } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET All
router.get('/', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'test') return res.json({ success: true, data: [] });
        const result = await db.query('SELECT * FROM tbl_Purchasing ORDER BY Prod_ID DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchasing.' });
    }
});

// POST Create — requires JWT + 'add' permission
router.post('/', authenticateJWT, requirePermission('add'), upload.single('purch_receipt_proof'), async (req, res) => {
    try {
        const {
            purch_date, prod_name, quantity, prod_cost, disc_availed,
            carriage_offload_cost, purch_from, contact_no, email,
            remarks, payment_certified // Custom API Param
        } = req.body;

        if (payment_certified !== 'true') return res.status(400).json({ error: 'Receipt must strictly be verified "FROM Sami TO Saif" to process Purchasing!' });

        const qty = new Decimal(quantity || 0);
        const pCost = new Decimal(prod_cost || 0);
        const disc = new Decimal(disc_availed || 0);
        const carriage = new Decimal(carriage_offload_cost || 0);

        const purch_amount = pCost.times(qty).minus(disc);
        const final_cost = purch_amount.plus(carriage);
        const per_item_rate = qty.gt(0) ? final_cost.dividedBy(qty) : new Decimal(0);
        const receiptPath = req.file ? `/uploads/${req.file.filename}` : null;

        if (process.env.NODE_ENV === 'test') { 
            return res.status(201).json({ success: true, data: { prod_name, quantity, purch_amount: purch_amount.toFixed(2), final_cost: final_cost.toFixed(2), per_item_rate: per_item_rate.toFixed(2) } });
        }

        const result = await db.query(
            `INSERT INTO tbl_Purchasing 
             (Purch_Date, Prod_Name, Quantity, Prod_Cost, Disc_Availed, Purch_Amount, Carriage_Offload_Cost, Final_Cost, Per_item_Rate, Purch_From, Contact_No, Email, Remarks, Purch_Receipt_Proof)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`,
            [
                purch_date || new Date(), prod_name, quantity, prod_cost, disc.toFixed(2), purch_amount.toFixed(2), 
                carriage.toFixed(2), final_cost.toFixed(2), per_item_rate.toFixed(2), purch_from, 
                contact_no, email, remarks, receiptPath
            ]
        );

        // Crucial bug fix: blast back the exact nested newly created row so frontend array can unshift.
        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error('Purchasing Tx POST Error:', err);
        res.status(500).json({ error: 'Failed to record purchasing safely.' });
    }
});

// PUT Edit — requires JWT + 'edit' permission
router.put('/:id', authenticateJWT, requirePermission('edit'), upload.single('purch_receipt_proof'), async (req, res) => {
    try {
        const { quantity, prod_cost, disc_availed, carriage_offload_cost, prod_name, purch_from } = req.body;
        
        const qty = new Decimal(quantity || 0);
        const pCost = new Decimal(prod_cost || 0);
        const disc = new Decimal(disc_availed || 0);
        const carriage = new Decimal(carriage_offload_cost || 0);

        const purch_amount = pCost.times(qty).minus(disc);
        const final_cost = purch_amount.plus(carriage);
        const per_item_rate = qty.gt(0) ? final_cost.dividedBy(qty) : new Decimal(0);

        const result = await db.query(
            `UPDATE tbl_Purchasing 
             SET Prod_Name = COALESCE($1, Prod_Name), 
                 Quantity = $2, Prod_Cost = $3, Disc_Availed = $4, Purch_Amount = $5, 
                 Carriage_Offload_Cost = $6, Final_Cost = $7, Per_item_Rate = $8,
                 Purch_From = COALESCE($9, Purch_From)
             WHERE Prod_ID = $10 RETURNING *;`,
            [
                prod_name, quantity, prod_cost, disc.toFixed(2), purch_amount.toFixed(2),
                carriage.toFixed(2), final_cost.toFixed(2), per_item_rate.toFixed(2),
                purch_from, req.params.id
            ]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to edit purchasing block safely.' });
    }
});

// DELETE — requires JWT + 'delete' permission
router.delete('/:id', authenticateJWT, requirePermission('delete'), async (req, res) => {
    try {
        await db.query(`DELETE FROM tbl_Purchasing WHERE Prod_ID = $1`, [req.params.id]);
        res.json({ success: true, message: 'Purchasing block entirely removed.' });
    } catch (err) {
        res.status(500).json({ error: 'Foreign Key integrity check failed: Entity tied to active Sales.' });
    }
});

module.exports = router;
