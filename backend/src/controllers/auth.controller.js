const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { sequelize } = require('../config/database');

/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const { full_name, email, password, phone, role, username } = req.body;

        // Validate input
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const [existingUsers] = await sequelize.query(
            'SELECT user_id FROM users WHERE email = $1',
            { bind: [email] }
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Generate username if not provided
        const generatedUsername = username || email.split('@')[0] + Date.now();

        // Create user
        const [result] = await sequelize.query(
            `INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING user_id, username, email, full_name, phone, role`,
            {
                bind: [generatedUsername, email, password_hash, full_name, phone, role || 'CUSTOMER', true]
            }
        );

        const user = result[0];

        logger.info(`New user registered: ${email}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during registration',
            error: error.message
        });
    }
};

/**
 * Login user
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const [users] = await sequelize.query(
            'SELECT user_id, username, email, password_hash, full_name, phone, role, is_active FROM users WHERE email = $1',
            { bind: [email] }
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            {
                expiresIn: process.env.JWT_EXPIRE || '24h'
            }
        );

        // Update last login
        await sequelize.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = $1',
            { bind: [user.user_id] }
        );

        logger.info(`User logged in: ${email}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};

/**
 * Logout user (client-side token removal)
 */
const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // Optionally, you can implement token blacklisting here
        
        logger.info(`User logged out: ${req.user?.email || 'Unknown'}`);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: error.message
        });
    }
};

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
    try {
        const [users] = await sequelize.query(
            'SELECT user_id, username, email, full_name, phone, role, is_active, created_at, last_login FROM users WHERE user_id = $1',
            { bind: [req.user.user_id] }
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const [users] = await sequelize.query(
            'SELECT user_id, email, password_hash FROM users WHERE user_id = $1',
            { bind: [req.user.user_id] }
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // Update password
        await sequelize.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
            { bind: [password_hash, user.user_id] }
        );

        logger.info(`Password changed for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        const [users] = await sequelize.query(
            'SELECT user_id, email FROM users WHERE user_id = $1',
            { bind: [req.user.user_id] }
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user
        await sequelize.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = NOW() WHERE user_id = $3',
            { bind: [full_name, phone, req.user.user_id] }
        );

        // Fetch updated user
        const [updatedUsers] = await sequelize.query(
            'SELECT user_id, username, full_name, email, phone, role FROM users WHERE user_id = $1',
            { bind: [req.user.user_id] }
        );

        logger.info(`Profile updated for user: ${updatedUsers[0].email}`);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUsers[0]
        });

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

/**
 * Helper function to get user by ID (for auth middleware)
 */
const getUserById = async (userId) => {
    try {
        const [users] = await sequelize.query(
            'SELECT user_id, username, email, full_name, phone, role, is_active FROM users WHERE user_id = $1',
            { bind: [userId] }
        );
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        logger.error('Error fetching user by ID:', error);
        return null;
    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    changePassword,
    updateProfile,
    getUserById
};

// Made with Bob