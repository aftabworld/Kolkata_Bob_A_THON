const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claim.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateClaim } = require('../middleware/validators');

/**
 * @route   POST /api/v1/claims
 * @desc    Create a new claim (Draft)
 * @access  Private (Customer)
 */
router.post(
    '/',
    authenticate,
    authorize('CUSTOMER'),
    validateClaim,
    claimController.createClaim
);

/**
 * @route   GET /api/v1/claims
 * @desc    Get all claims (filtered by role)
 * @access  Private (All authenticated users)
 */
router.get(
    '/',
    authenticate,
    claimController.getAllClaims
);

/**
 * @route   GET /api/v1/claims/:claimId
 * @desc    Get claim by ID
 * @access  Private
 */
router.get(
    '/:claimId',
    authenticate,
    claimController.getClaimById
);

/**
 * @route   PUT /api/v1/claims/:claimId
 * @desc    Update claim (Customer can update draft/rejected claims)
 * @access  Private (Customer)
 */
router.put(
    '/:claimId',
    authenticate,
    authorize('CUSTOMER'),
    validateClaim,
    claimController.updateClaim
);

/**
 * @route   POST /api/v1/claims/:claimId/submit
 * @desc    Submit claim for review
 * @access  Private (Customer)
 */
router.post(
    '/:claimId/submit',
    authenticate,
    authorize('CUSTOMER'),
    claimController.submitClaim
);

/**
 * @route   POST /api/v1/claims/:claimId/review
 * @desc    Review claim (Auditor)
 * @access  Private (Auditor)
 */
router.post(
    '/:claimId/review',
    authenticate,
    authorize('AUDITOR'),
    claimController.reviewClaim
);

/**
 * @route   POST /api/v1/claims/:claimId/payment
 * @desc    Process payment for approved claim (Cashier)
 * @access  Private (Cashier)
 */
router.post(
    '/:claimId/payment',
    authenticate,
    authorize('CASHIER'),
    claimController.processPayment
);

/**
 * @route   GET /api/v1/claims/stats
 * @desc    Get claim statistics
 * @access  Private
 */
router.get(
    '/stats',
    authenticate,
    claimController.getClaimStats
);

/**
 * @route   DELETE /api/v1/claims/:claimId
 * @desc    Delete claim (only draft claims)
 * @access  Private (Customer or Admin)
 */
router.delete(
    '/:claimId',
    authenticate,
    claimController.deleteClaim
);

module.exports = router;

// Made with Bob
