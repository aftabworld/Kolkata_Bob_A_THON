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
 * @route   POST /api/v1/claims/:claimId/approve
 * @desc    Approve claim (Auditor)
 * @access  Private (Auditor)
 */
router.post(
    '/:claimId/approve',
    authenticate,
    authorize('AUDITOR'),
    claimController.approveClaim
);

/**
 * @route   POST /api/v1/claims/:claimId/reject
 * @desc    Reject claim (Auditor)
 * @access  Private (Auditor)
 */
router.post(
    '/:claimId/reject',
    authenticate,
    authorize('AUDITOR'),
    claimController.rejectClaim
);

/**
 * @route   POST /api/v1/claims/:claimId/resubmit
 * @desc    Resubmit rejected claim (Customer)
 * @access  Private (Customer)
 */
router.post(
    '/:claimId/resubmit',
    authenticate,
    authorize('CUSTOMER'),
    claimController.resubmitClaim
);

/**
 * @route   GET /api/v1/claims/:claimId/history
 * @desc    Get claim history/audit trail
 * @access  Private
 */
router.get(
    '/:claimId/history',
    authenticate,
    claimController.getClaimHistory
);

/**
 * @route   GET /api/v1/claims/:claimId/workflow
 * @desc    Get claim workflow status
 * @access  Private
 */
router.get(
    '/:claimId/workflow',
    authenticate,
    claimController.getClaimWorkflow
);

/**
 * @route   POST /api/v1/claims/:claimId/comments
 * @desc    Add comment to claim
 * @access  Private
 */
router.post(
    '/:claimId/comments',
    authenticate,
    claimController.addComment
);

/**
 * @route   GET /api/v1/claims/:claimId/comments
 * @desc    Get all comments for a claim
 * @access  Private
 */
router.get(
    '/:claimId/comments',
    authenticate,
    claimController.getComments
);

/**
 * @route   GET /api/v1/claims/customer/:customerId
 * @desc    Get all claims for a customer
 * @access  Private (Customer or Admin)
 */
router.get(
    '/customer/:customerId',
    authenticate,
    claimController.getClaimsByCustomer
);

/**
 * @route   GET /api/v1/claims/stats/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get(
    '/stats/dashboard',
    authenticate,
    claimController.getDashboardStats
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
