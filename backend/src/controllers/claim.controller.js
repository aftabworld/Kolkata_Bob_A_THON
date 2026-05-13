const { sequelize } = require('../config/database');
const {
    ClaimRequest,
    CustomerMaster,
    InsurancePolicy,
    ClaimHistory,
    ClaimComment,
    ClaimWorkflow,
    ClaimDocument,
    User
} = require('../models');
const logger = require('../utils/logger');
const { validateClaimAmount, validatePolicyValidity, validateDocuments } = require('../utils/validators');
const { sendNotification } = require('../services/notification.service');
const { calculateRiskScore } = require('../services/fraud-detection.service');

/**
 * Create a new claim (Draft)
 */
const createClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const {
            policy_id,
            claim_amount,
            claim_type,
            treatment_type,
            hospital_name,
            admission_date,
            discharge_date,
            diagnosis,
            claim_description
        } = req.body;

        // Get customer details
        const customer = await CustomerMaster.findOne({
            where: { user_id: req.user.user_id },
            transaction
        });

        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Get and validate insurance policy
        const policy = await InsurancePolicy.findOne({
            where: {
                policy_id,
                customer_id: customer.customer_id,
                is_active: true
            },
            transaction
        });

        if (!policy) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Active insurance policy not found'
            });
        }

        // Validate policy validity
        const policyValidation = validatePolicyValidity(policy);
        if (!policyValidation.valid) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: policyValidation.message
            });
        }

        // Validate claim amount
        const amountValidation = validateClaimAmount(claim_amount, policy.remaining_amount);
        if (!amountValidation.valid) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: amountValidation.message
            });
        }

        // Generate claim number
        const claimNumber = `CLM${Date.now()}${customer.customer_id}`;

        // Create claim
        const claim = await ClaimRequest.create({
            claim_number: claimNumber,
            customer_id: customer.customer_id,
            policy_id,
            claim_amount,
            claim_type,
            treatment_type,
            hospital_name,
            admission_date,
            discharge_date,
            diagnosis,
            claim_description,
            status: 'DRAFT',
            current_version: 1,
            submitted_by: req.user.user_id
        }, { transaction });

        // Create initial history record
        await ClaimHistory.create({
            claim_id: claim.claim_id,
            version_number: 1,
            claim_amount,
            claim_description,
            status: 'DRAFT',
            changed_by: req.user.user_id,
            change_reason: 'Initial claim creation',
            snapshot_data: claim.toJSON()
        }, { transaction });

        // Create workflow record
        await ClaimWorkflow.create({
            claim_id: claim.claim_id,
            from_status: null,
            to_status: 'DRAFT',
            action_by: req.user.user_id,
            action_type: 'CREATE',
            comments: 'Claim created as draft'
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Claim created successfully',
            data: claim
        });

    } catch (error) {
        await transaction.rollback();
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
        const { status, page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};

        // Filter based on user role
        if (req.user.role === 'CUSTOMER') {
            const customer = await CustomerMaster.findOne({
                where: { user_id: req.user.user_id }
            });
            whereClause.customer_id = customer.customer_id;
        } else if (req.user.role === 'AUDITOR') {
            whereClause.status = ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'];
        } else if (req.user.role === 'CASHIER') {
            whereClause.status = ['APPROVED', 'PAYMENT_PROCESSING'];
        }

        // Add status filter if provided
        if (status) {
            whereClause.status = status;
        }

        const { count, rows: claims } = await ClaimRequest.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: CustomerMaster,
                    as: 'customer',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['user_id', 'full_name', 'email']
                    }]
                },
                {
                    model: InsurancePolicy,
                    as: 'policy'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, order]]
        });

        res.status(200).json({
            success: true,
            data: {
                claims,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
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

        const claim = await ClaimRequest.findByPk(claimId, {
            include: [
                {
                    model: CustomerMaster,
                    as: 'customer',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['user_id', 'full_name', 'email', 'phone']
                    }]
                },
                {
                    model: InsurancePolicy,
                    as: 'policy'
                },
                {
                    model: ClaimDocument,
                    as: 'documents'
                }
            ]
        });

        if (!claim) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        // Check authorization
        if (req.user.role === 'CUSTOMER') {
            const customer = await CustomerMaster.findOne({
                where: { user_id: req.user.user_id }
            });
            if (claim.customer_id !== customer.customer_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: claim
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
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;
        const updateData = req.body;

        const claim = await ClaimRequest.findByPk(claimId, { transaction });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        // Check if claim can be updated
        if (!['DRAFT', 'REJECTED'].includes(claim.status)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only draft or rejected claims can be updated'
            });
        }

        // Verify ownership
        const customer = await CustomerMaster.findOne({
            where: { user_id: req.user.user_id },
            transaction
        });

        if (claim.customer_id !== customer.customer_id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update claim
        await claim.update(updateData, { transaction });

        // Create history record
        await ClaimHistory.create({
            claim_id: claim.claim_id,
            version_number: claim.current_version,
            claim_amount: claim.claim_amount,
            claim_description: claim.claim_description,
            status: claim.status,
            changed_by: req.user.user_id,
            change_reason: 'Claim updated',
            snapshot_data: claim.toJSON()
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim updated successfully',
            data: claim
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating claim',
            error: error.message
        });
    }
};

/**
 * Submit claim for review
 */
const submitClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;

        const claim = await ClaimRequest.findByPk(claimId, {
            include: [
                { model: InsurancePolicy, as: 'policy' },
                { model: ClaimDocument, as: 'documents' }
            ],
            transaction
        });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        // Verify ownership
        const customer = await CustomerMaster.findOne({
            where: { user_id: req.user.user_id },
            transaction
        });

        if (claim.customer_id !== customer.customer_id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if claim is in submittable state
        if (!['DRAFT', 'REJECTED'].includes(claim.status)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Claim cannot be submitted in current state'
            });
        }

        // Validate documents
        const docValidation = await validateDocuments(claim.claim_id);
        if (!docValidation.valid) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: docValidation.message,
                missingDocuments: docValidation.missingDocuments
            });
        }

        // Calculate fraud risk score
        const riskScore = await calculateRiskScore(claim);

        // Update claim status
        await claim.update({
            status: 'SUBMITTED',
            submitted_at: new Date()
        }, { transaction });

        // Create workflow record
        await ClaimWorkflow.create({
            claim_id: claim.claim_id,
            from_status: claim.status === 'REJECTED' ? 'REJECTED' : 'DRAFT',
            to_status: 'SUBMITTED',
            action_by: req.user.user_id,
            action_type: 'SUBMIT',
            comments: 'Claim submitted for review'
        }, { transaction });

        // Send notification to auditors
        await sendNotification({
            type: 'CLAIM_SUBMITTED',
            claimId: claim.claim_id,
            recipientRole: 'AUDITOR',
            message: `New claim ${claim.claim_number} submitted for review`
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim submitted successfully',
            data: {
                claim,
                riskScore
            }
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error submitting claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting claim',
            error: error.message
        });
    }
};

/**
 * Review claim (Auditor)
 */
const reviewClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;
        const { comments } = req.body;

        const claim = await ClaimRequest.findByPk(claimId, { transaction });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        if (claim.status !== 'SUBMITTED' && claim.status !== 'RESUBMITTED') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Claim is not in reviewable state'
            });
        }

        // Update claim status
        await claim.update({
            status: 'UNDER_REVIEW',
            reviewed_by: req.user.user_id,
            reviewed_at: new Date()
        }, { transaction });

        // Add comment
        if (comments) {
            await ClaimComment.create({
                claim_id: claim.claim_id,
                user_id: req.user.user_id,
                comment_text: comments,
                comment_type: 'REVIEW',
                is_visible_to_customer: true
            }, { transaction });
        }

        // Create workflow record
        await ClaimWorkflow.create({
            claim_id: claim.claim_id,
            from_status: claim.status === 'RESUBMITTED' ? 'RESUBMITTED' : 'SUBMITTED',
            to_status: 'UNDER_REVIEW',
            action_by: req.user.user_id,
            action_type: 'REVIEW',
            comments
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim marked as under review',
            data: claim
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error reviewing claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error reviewing claim',
            error: error.message
        });
    }
};

/**
 * Approve claim (Auditor)
 */
const approveClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;
        const { approved_amount, comments } = req.body;

        const claim = await ClaimRequest.findByPk(claimId, {
            include: [{ model: InsurancePolicy, as: 'policy' }],
            transaction
        });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        if (claim.status !== 'UNDER_REVIEW') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Claim must be under review to approve'
            });
        }

        const finalAmount = approved_amount || claim.claim_amount;

        // Validate approved amount
        if (finalAmount > claim.policy.remaining_amount) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Approved amount exceeds remaining insurance coverage'
            });
        }

        // Update claim status
        await claim.update({
            status: 'APPROVED',
            approved_by: req.user.user_id,
            approved_at: new Date()
        }, { transaction });

        // Update policy remaining amount
        await claim.policy.update({
            remaining_amount: claim.policy.remaining_amount - finalAmount
        }, { transaction });

        // Add approval comment
        await ClaimComment.create({
            claim_id: claim.claim_id,
            user_id: req.user.user_id,
            comment_text: comments || 'Claim approved',
            comment_type: 'APPROVAL',
            is_visible_to_customer: true
        }, { transaction });

        // Create workflow record
        await ClaimWorkflow.create({
            claim_id: claim.claim_id,
            from_status: 'UNDER_REVIEW',
            to_status: 'APPROVED',
            action_by: req.user.user_id,
            action_type: 'APPROVE',
            comments
        }, { transaction });

        // Send notification to customer and cashier
        await sendNotification({
            type: 'CLAIM_APPROVED',
            claimId: claim.claim_id,
            recipientRole: ['CUSTOMER', 'CASHIER'],
            message: `Claim ${claim.claim_number} has been approved`
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim approved successfully',
            data: claim
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error approving claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving claim',
            error: error.message
        });
    }
};

/**
 * Reject claim (Auditor)
 */
const rejectClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;
        const { reason, comments } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const claim = await ClaimRequest.findByPk(claimId, { transaction });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        if (claim.status !== 'UNDER_REVIEW') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Claim must be under review to reject'
            });
        }

        // Update claim status
        await claim.update({
            status: 'REJECTED',
            reviewed_by: req.user.user_id,
            reviewed_at: new Date()
        }, { transaction });

        // Add rejection comment
        await ClaimComment.create({
            claim_id: claim.claim_id,
            user_id: req.user.user_id,
            comment_text: `Rejection Reason: ${reason}\n${comments || ''}`,
            comment_type: 'REJECTION',
            is_visible_to_customer: true
        }, { transaction });

        // Create workflow record
        await ClaimWorkflow.create({
            claim_id: claim.claim_id,
            from_status: 'UNDER_REVIEW',
            to_status: 'REJECTED',
            action_by: req.user.user_id,
            action_type: 'REJECT',
            comments: reason
        }, { transaction });

        // Send notification to customer
        await sendNotification({
            type: 'CLAIM_REJECTED',
            claimId: claim.claim_id,
            recipientRole: 'CUSTOMER',
            message: `Claim ${claim.claim_number} has been rejected. Reason: ${reason}`
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim rejected',
            data: claim
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error rejecting claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting claim',
            error: error.message
        });
    }
};

/**
 * Resubmit rejected claim (Customer)
 */
const resubmitClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;
        const { resubmission_notes } = req.body;

        const claim = await ClaimRequest.findByPk(claimId, { transaction });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        // Verify ownership
        const customer = await CustomerMaster.findOne({
            where: { user_id: req.user.user_id },
            transaction
        });

        if (claim.customer_id !== customer.customer_id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (claim.status !== 'REJECTED') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only rejected claims can be resubmitted'
            });
        }

        // Increment version
        const newVersion = claim.current_version + 1;

        // Update claim
        await claim.update({
            status: 'RESUBMITTED',
            current_version: newVersion,
            submitted_at: new Date()
        }, { transaction });

        // Create history record
        await ClaimHistory.create({
            claim_id: claim.claim_id,
            version_number: newVersion,
            claim_amount: claim.claim_amount,
            claim_description: claim.claim_description,
            status: 'RESUBMITTED',
            changed_by: req.user.user_id,
            change_reason: resubmission_notes || 'Claim resubmitted after corrections',
            snapshot_data: claim.toJSON()
        }, { transaction });

        // Add comment
        if (resubmission_notes) {
            await ClaimComment.create({
                claim_id: claim.claim_id,
                user_id: req.user.user_id,
                comment_text: resubmission_notes,
                comment_type: 'QUERY',
                is_visible_to_customer: true
            }, { transaction });
        }

        // Create workflow record
        await ClaimWorkflow.create({
            claim_id: claim.claim_id,
            from_status: 'REJECTED',
            to_status: 'RESUBMITTED',
            action_by: req.user.user_id,
            action_type: 'RESUBMIT',
            comments: resubmission_notes
        }, { transaction });

        // Send notification to auditors
        await sendNotification({
            type: 'CLAIM_RESUBMITTED',
            claimId: claim.claim_id,
            recipientRole: 'AUDITOR',
            message: `Claim ${claim.claim_number} has been resubmitted (Version ${newVersion})`
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim resubmitted successfully',
            data: claim
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error resubmitting claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error resubmitting claim',
            error: error.message
        });
    }
};

/**
 * Get claim history
 */
const getClaimHistory = async (req, res) => {
    try {
        const { claimId } = req.params;

        const history = await ClaimHistory.findAll({
            where: { claim_id: claimId },
            include: [{
                model: User,
                as: 'changedBy',
                attributes: ['user_id', 'full_name', 'role']
            }],
            order: [['changed_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        logger.error('Error fetching claim history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching claim history',
            error: error.message
        });
    }
};

/**
 * Get claim workflow
 */
const getClaimWorkflow = async (req, res) => {
    try {
        const { claimId } = req.params;

        const workflow = await ClaimWorkflow.findAll({
            where: { claim_id: claimId },
            include: [{
                model: User,
                as: 'actionBy',
                attributes: ['user_id', 'full_name', 'role']
            }],
            order: [['created_at', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: workflow
        });

    } catch (error) {
        logger.error('Error fetching claim workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching claim workflow',
            error: error.message
        });
    }
};

/**
 * Add comment to claim
 */
const addComment = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { comment_text, comment_type = 'QUERY', is_visible_to_customer = true } = req.body;

        if (!comment_text) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const comment = await ClaimComment.create({
            claim_id: claimId,
            user_id: req.user.user_id,
            comment_text,
            comment_type,
            is_visible_to_customer
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: comment
        });

    } catch (error) {
        logger.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding comment',
            error: error.message
        });
    }
};

/**
 * Get all comments for a claim
 */
const getComments = async (req, res) => {
    try {
        const { claimId } = req.params;

        let whereClause = { claim_id: claimId };

        // Customers can only see comments visible to them
        if (req.user.role === 'CUSTOMER') {
            whereClause.is_visible_to_customer = true;
        }

        const comments = await ClaimComment.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['user_id', 'full_name', 'role']
            }],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: comments
        });

    } catch (error) {
        logger.error('Error fetching comments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching comments',
            error: error.message
        });
    }
};

/**
 * Get claims by customer
 */
const getClaimsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Check authorization
        if (req.user.role === 'CUSTOMER') {
            const customer = await CustomerMaster.findOne({
                where: { user_id: req.user.user_id }
            });
            if (customer.customer_id !== parseInt(customerId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        const claims = await ClaimRequest.findAll({
            where: { customer_id: customerId },
            include: [
                { model: InsurancePolicy, as: 'policy' }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: claims
        });

    } catch (error) {
        logger.error('Error fetching customer claims:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer claims',
            error: error.message
        });
    }
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
    try {
        let stats = {};

        if (req.user.role === 'CUSTOMER') {
            const customer = await CustomerMaster.findOne({
                where: { user_id: req.user.user_id }
            });

            stats = await ClaimRequest.findAll({
                where: { customer_id: customer.customer_id },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('claim_id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('claim_amount')), 'total_amount']
                ],
                group: ['status'],
                raw: true
            });

        } else if (req.user.role === 'AUDITOR') {
            stats = await ClaimRequest.findAll({
                where: {
                    status: ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED']
                },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('claim_id')), 'count']
                ],
                group: ['status'],
                raw: true
            });

        } else if (req.user.role === 'CASHIER') {
            stats = await ClaimRequest.findAll({
                where: {
                    status: ['APPROVED', 'PAYMENT_PROCESSING']
                },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('claim_id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('claim_amount')), 'total_amount']
                ],
                group: ['status'],
                raw: true
            });

        } else if (req.user.role === 'ADMIN') {
            stats = await ClaimRequest.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('claim_id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('claim_amount')), 'total_amount']
                ],
                group: ['status'],
                raw: true
            });
        }

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};

/**
 * Delete claim (only draft claims)
 */
const deleteClaim = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { claimId } = req.params;

        const claim = await ClaimRequest.findByPk(claimId, { transaction });

        if (!claim) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        // Only draft claims can be deleted
        if (claim.status !== 'DRAFT') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only draft claims can be deleted'
            });
        }

        // Verify ownership or admin
        if (req.user.role !== 'ADMIN') {
            const customer = await CustomerMaster.findOne({
                where: { user_id: req.user.user_id },
                transaction
            });
            if (claim.customer_id !== customer.customer_id) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        await claim.destroy({ transaction });
        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Claim deleted successfully'
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting claim:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting claim',
            error: error.message
        });
    }
};

module.exports = {
    createClaim,
    getAllClaims,
    getClaimById,
    updateClaim,
    submitClaim,
    reviewClaim,
    approveClaim,
    rejectClaim,
    resubmitClaim,
    getClaimHistory,
    getClaimWorkflow,
    addComment,
    getComments,
    getClaimsByCustomer,
    getDashboardStats,
    deleteClaim
};

// Made with Bob
