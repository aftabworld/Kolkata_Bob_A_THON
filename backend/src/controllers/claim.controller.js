const logger = require('../utils/logger');
const { sequelize } = require('../config/database');

/**
 * Create a new claim (Draft or Submit)
 */
const createClaim = async (req, res) => {
    try {
        const {
            claim_amount,
            claim_type,
            treatment_type,
            hospital_name,
            hospital_address,
            admission_date,
            discharge_date,
            diagnosis,
            treatment_details,
            doctor_name,
            doctor_registration_no,
            claim_description,
            submit = false
        } = req.body;

        // Validate required fields
        if (!claim_amount || !claim_type || !hospital_name || !diagnosis) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate claim amount
        if (claim_amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Claim amount must be greater than 0'
            });
        }

        // Generate claim number
        const claimNumber = `CLM${Date.now()}${req.user.user_id}`;

        // Determine initial status
        const status = submit ? 'SUBMITTED' : 'DRAFT';

        // Insert claim into database
        const [result] = await sequelize.query(
            `INSERT INTO claim_request (
                claim_number, claim_amount, claim_type, treatment_type,
                hospital_name, diagnosis, claim_description, status,
                admission_date, discharge_date, submitted_by,
                submitted_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING claim_id, claim_number, claim_amount, claim_type, treatment_type,
                      hospital_name, diagnosis, claim_description, status,
                      admission_date, discharge_date, created_at`,
            {
                bind: [
                    claimNumber,
                    claim_amount,
                    claim_type,
                    treatment_type || null,
                    hospital_name,
                    diagnosis,
                    claim_description || null,
                    status,
                    admission_date || null,
                    discharge_date || null,
                    req.user.user_id,
                    submit ? new Date() : null
                ]
            }
        );

        const claim = result[0];

        logger.info(`Claim ${status.toLowerCase()}: ${claimNumber} by user ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: `Claim ${status.toLowerCase()} successfully`,
            data: {
                claim: {
                    ...claim,
                    customer_name: req.user.full_name,
                    customer_email: req.user.email
                }
            }
        });

    } catch (error) {
        logger.error('Error creating claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating claim',
            error: error.message
        });
    }
};

/**
 * Get all claims (filtered by role)
 */
const getAllClaims = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let whereClause = '';
        let bindings = [];

        // Filter based on user role
        if (req.user.role === 'CUSTOMER') {
            whereClause = 'WHERE cr.submitted_by = $1';
            bindings.push(req.user.user_id);
        } else if (req.user.role === 'AUDITOR') {
            whereClause = "WHERE cr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED')";
        } else if (req.user.role === 'CASHIER') {
            whereClause = "WHERE cr.status IN ('APPROVED', 'PAYMENT_PROCESSING')";
        }

        // Add status filter if provided
        if (status) {
            if (whereClause) {
                whereClause += ` AND cr.status = $${bindings.length + 1}`;
            } else {
                whereClause = `WHERE cr.status = $${bindings.length + 1}`;
            }
            bindings.push(status);
        }

        // Get total count
        const [countResult] = await sequelize.query(
            `SELECT COUNT(*) as total FROM claim_request cr ${whereClause}`,
            { bind: bindings }
        );
        const total = parseInt(countResult[0].total);

        // Get paginated claims
        const offset = (page - 1) * limit;
        bindings.push(parseInt(limit), offset);

        const [claims] = await sequelize.query(
            `SELECT 
                cr.claim_id, cr.claim_number, cr.claim_amount, cr.claim_type,
                cr.treatment_type, cr.hospital_name, cr.diagnosis,
                cr.claim_description, cr.status, cr.admission_date,
                cr.discharge_date, cr.created_at, cr.submitted_at,
                u.full_name as customer_name, u.email as customer_email
            FROM claim_request cr
            LEFT JOIN users u ON cr.submitted_by = u.user_id
            ${whereClause}
            ORDER BY cr.created_at DESC
            LIMIT $${bindings.length - 1} OFFSET $${bindings.length}`,
            { bind: bindings }
        );

        res.status(200).json({
            success: true,
            data: {
                claims,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Error fetching claims:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching claims',
            error: error.message
        });
    }
};

/**
 * Get claim by ID
 */
const getClaimById = async (req, res) => {
    try {
        const { claimId } = req.params;

        const [claims] = await sequelize.query(
            `SELECT 
                cr.*, 
                u.full_name as customer_name, 
                u.email as customer_email,
                u.phone as customer_phone
            FROM claim_request cr
            LEFT JOIN users u ON cr.submitted_by = u.user_id
            WHERE cr.claim_id = $1`,
            { bind: [claimId] }
        );

        if (claims.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const claim = claims[0];

        // Check authorization
        if (req.user.role === 'CUSTOMER' && claim.submitted_by !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: { claim }
        });

    } catch (error) {
        logger.error('Error fetching claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching claim',
            error: error.message
        });
    }
};

/**
 * Update claim (only draft or rejected claims)
 */
const updateClaim = async (req, res) => {
    try {
        const { claimId } = req.params;
        const updateData = req.body;

        const [claims] = await sequelize.query(
            'SELECT claim_id, status, submitted_by FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        if (claims.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const claim = claims[0];

        // Check authorization
        if (req.user.role === 'CUSTOMER' && claim.submitted_by !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Only allow updates for DRAFT or REJECTED claims
        if (!['DRAFT', 'REJECTED'].includes(claim.status)) {
            return res.status(400).json({
                success: false,
                message: 'Only draft or rejected claims can be updated'
            });
        }

        // Build update query
        const updates = [];
        const bindings = [];
        let bindIndex = 1;

        if (updateData.claim_amount !== undefined) {
            updates.push(`claim_amount = $${bindIndex++}`);
            bindings.push(parseFloat(updateData.claim_amount));
        }
        if (updateData.claim_type !== undefined) {
            updates.push(`claim_type = $${bindIndex++}`);
            bindings.push(updateData.claim_type);
        }
        if (updateData.treatment_type !== undefined) {
            updates.push(`treatment_type = $${bindIndex++}`);
            bindings.push(updateData.treatment_type);
        }
        if (updateData.hospital_name !== undefined) {
            updates.push(`hospital_name = $${bindIndex++}`);
            bindings.push(updateData.hospital_name);
        }
        if (updateData.diagnosis !== undefined) {
            updates.push(`diagnosis = $${bindIndex++}`);
            bindings.push(updateData.diagnosis);
        }
        if (updateData.claim_description !== undefined) {
            updates.push(`claim_description = $${bindIndex++}`);
            bindings.push(updateData.claim_description);
        }
        if (updateData.admission_date !== undefined) {
            updates.push(`admission_date = $${bindIndex++}`);
            bindings.push(updateData.admission_date || null);
        }
        if (updateData.discharge_date !== undefined) {
            updates.push(`discharge_date = $${bindIndex++}`);
            bindings.push(updateData.discharge_date || null);
        }

        // Update status if submit flag is true
        if (updateData.submit) {
            if (claim.status === 'DRAFT') {
                updates.push(`status = $${bindIndex++}`);
                bindings.push('SUBMITTED');
                updates.push(`submitted_at = $${bindIndex++}`);
                bindings.push(new Date());
            } else if (claim.status === 'REJECTED') {
                updates.push(`status = $${bindIndex++}`);
                bindings.push('RESUBMITTED');
                updates.push(`submitted_at = $${bindIndex++}`);
                bindings.push(new Date());
            }
        }

        updates.push(`updated_at = NOW()`);
        bindings.push(claimId);

        await sequelize.query(
            `UPDATE claim_request SET ${updates.join(', ')} WHERE claim_id = $${bindIndex}`,
            { bind: bindings }
        );

        // Fetch updated claim
        const [updatedClaims] = await sequelize.query(
            'SELECT * FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        logger.info(`Claim updated: ${updatedClaims[0].claim_number} by user ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Claim updated successfully',
            data: { claim: updatedClaims[0] }
        });

    } catch (error) {
        logger.error('Error updating claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating claim',
            error: error.message
        });
    }
};

/**
 * Delete claim (only draft claims)
 */
const deleteClaim = async (req, res) => {
    try {
        const { claimId } = req.params;

        const [claims] = await sequelize.query(
            'SELECT claim_id, claim_number, status, submitted_by FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        if (claims.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const claim = claims[0];

        // Check authorization
        if (req.user.role === 'CUSTOMER' && claim.submitted_by !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Only allow deletion of DRAFT claims
        if (claim.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: 'Only draft claims can be deleted'
            });
        }

        await sequelize.query(
            'DELETE FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        logger.info(`Claim deleted: ${claim.claim_number} by user ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Claim deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting claim',
            error: error.message
        });
    }
};

/**
 * Submit claim for review
 */
const submitClaim = async (req, res) => {
    try {
        const { claimId } = req.params;

        const [claims] = await sequelize.query(
            'SELECT claim_id, claim_number, status, submitted_by FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        if (claims.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const claim = claims[0];

        // Check authorization
        if (claim.submitted_by !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Only allow submission of DRAFT claims
        if (claim.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: 'Only draft claims can be submitted'
            });
        }

        await sequelize.query(
            'UPDATE claim_request SET status = $1, submitted_at = NOW(), updated_at = NOW() WHERE claim_id = $2',
            { bind: ['SUBMITTED', claimId] }
        );

        logger.info(`Claim submitted: ${claim.claim_number} by user ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Claim submitted successfully'
        });

    } catch (error) {
        logger.error('Error submitting claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting claim',
            error: error.message
        });
    }
};

/**
 * Review claim (Auditor only)
 */
const reviewClaim = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { action, comments, approved_amount } = req.body;

        const [claims] = await sequelize.query(
            'SELECT claim_id, claim_number, status, claim_amount FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        if (claims.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const claim = claims[0];

        // Only auditors can review
        if (req.user.role !== 'AUDITOR') {
            return res.status(403).json({
                success: false,
                message: 'Only auditors can review claims'
            });
        }

        // Only allow review of SUBMITTED or RESUBMITTED claims
        if (!['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(claim.status)) {
            return res.status(400).json({
                success: false,
                message: 'Claim is not in reviewable status'
            });
        }

        let newStatus, updateQuery;
        if (action === 'approve') {
            newStatus = 'APPROVED';
            updateQuery = `UPDATE claim_request 
                          SET status = $1, reviewed_by = $2, approved_by = $3, 
                              reviewed_at = NOW(), approved_at = NOW(), updated_at = NOW()
                          WHERE claim_id = $4`;
            await sequelize.query(updateQuery, {
                bind: [newStatus, req.user.user_id, req.user.user_id, claimId]
            });
        } else if (action === 'reject') {
            newStatus = 'REJECTED';
            updateQuery = `UPDATE claim_request 
                          SET status = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
                          WHERE claim_id = $3`;
            await sequelize.query(updateQuery, {
                bind: [newStatus, req.user.user_id, claimId]
            });
        } else if (action === 'request_info') {
            newStatus = 'UNDER_REVIEW';
            updateQuery = `UPDATE claim_request 
                          SET status = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
                          WHERE claim_id = $3`;
            await sequelize.query(updateQuery, {
                bind: [newStatus, req.user.user_id, claimId]
            });
        }

        logger.info(`Claim ${action}: ${claim.claim_number} by auditor ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: `Claim ${action} successfully`
        });

    } catch (error) {
        logger.error('Error reviewing claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error reviewing claim',
            error: error.message
        });
    }
};

/**
 * Process payment (Cashier only)
 */
const processPayment = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { payment_method, transaction_id } = req.body;

        const [claims] = await sequelize.query(
            'SELECT claim_id, claim_number, status FROM claim_request WHERE claim_id = $1',
            { bind: [claimId] }
        );

        if (claims.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const claim = claims[0];

        // Only cashiers can process payment
        if (req.user.role !== 'CASHIER') {
            return res.status(403).json({
                success: false,
                message: 'Only cashiers can process payments'
            });
        }

        // Only allow payment for APPROVED claims
        if (claim.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                message: 'Only approved claims can be paid'
            });
        }

        await sequelize.query(
            `UPDATE claim_request 
             SET status = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW()
             WHERE claim_id = $3`,
            { bind: ['PAYMENT_DONE', req.user.user_id, claimId] }
        );

        logger.info(`Payment processed: ${claim.claim_number} by cashier ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully'
        });

    } catch (error) {
        logger.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

/**
 * Get claim statistics
 */
const getClaimStats = async (req, res) => {
    try {
        let whereClause = '';
        const bindings = [];

        // Filter by user role
        if (req.user.role === 'CUSTOMER') {
            whereClause = 'WHERE submitted_by = $1';
            bindings.push(req.user.user_id);
        }

        const [stats] = await sequelize.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft,
                COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) as submitted,
                COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END) as under_review,
                COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'PAYMENT_DONE' THEN 1 END) as paid,
                COALESCE(SUM(claim_amount), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN claim_amount ELSE 0 END), 0) as approved_amount
            FROM claim_request
            ${whereClause}`,
            { bind: bindings }
        );

        res.status(200).json({
            success: true,
            data: { stats: stats[0] }
        });

    } catch (error) {
        logger.error('Error fetching claim stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching claim statistics',
            error: error.message
        });
    }
};

module.exports = {
    createClaim,
    getAllClaims,
    getClaimById,
    updateClaim,
    deleteClaim,
    submitClaim,
    reviewClaim,
    processPayment,
    getClaimStats
};

// Made with Bob
