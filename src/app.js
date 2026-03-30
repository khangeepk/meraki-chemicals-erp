const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const purchasingRoutes = require('./routes/purchasing');
const salesRoutes = require('./routes/sales');
const productsRoutes = require('./routes/products');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/purchasing', purchasingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/products', productsRoutes);

// Fix for "Cannot GET /"
app.get('/', (req, res) => {
    res.json({ status: 'API is running successfully. Meraki CMS Backend is healthy.' });
});

// Generic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
