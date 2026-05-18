const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { getUserById } = require('../controllers/auth.controller');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await getUserById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Authorization denied.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'User account is inactive.'
            });
        }

        // Attach user to request (password_hash already excluded in getUserById)
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

/**
 * Authorize based on user roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Check if user owns the resource or has admin privileges
 */
const authorizeOwnerOrAdmin = (resourceUserIdField = 'user_id') => {
    return (req, res, next) => {
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (req.user.role === 'ADMIN' || req.user.user_id === parseInt(resourceUserId)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
        });
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await getUserById(decoded.userId);
            
            if (user && user.is_active) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    authorizeOwnerOrAdmin,
    optionalAuth
};

// Made with Bob
