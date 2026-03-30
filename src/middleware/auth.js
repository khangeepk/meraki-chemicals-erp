const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meraki_super_secret_key_2026';

const authenticateJWT = (req, res, next) => {
    // Allows mock bypass during frontend layout dev if configured, but strict otherwise
    if (process.env.NODE_ENV === 'test' && !req.headers.authorization) {
        req.user = { id: 1, role: 'Admin', permissions: { add: true, edit: true, delete: true } };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Auth header missing. Access Denied.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ error: 'Strict Admin Privileges Required.' });
    }
};

const requirePermission = (action) => {
    return (req, res, next) => {
        if (req.user && req.user.role === 'Admin') return next(); // Admins bypass
        
        if (req.user && req.user.permissions && req.user.permissions[action]) {
            next();
        } else {
            res.status(403).json({ error: `Permission Denied. You lack '${action}' capability.` });
        }
    };
};

module.exports = { authenticateJWT, requireAdmin, requirePermission, JWT_SECRET };
