const logger = require('../utils/logger');
const { FraudDetectionLog } = require('../models');

/**
 * AI-Powered Fraud Detection Service
 * Analyzes claims for potential fraud using multiple indicators
 */

/**
 * Calculate risk score for a claim
 * @param {Object} claim - Claim object with all details
 * @returns {Object} Risk assessment result
 */
const calculateRiskScore = async (claim) => {
    try {
        let riskScore = 0;
        const fraudIndicators = [];

        // 1. Amount-based risk factors
        const amountRisk = analyzeClaimAmount(claim);
        riskScore += amountRisk.score;
        if (amountRisk.indicators.length > 0) {
            fraudIndicators.push(...amountRisk.indicators);
        }

        // 2. Frequency-based risk factors
        const frequencyRisk = await analyzeClaimFrequency(claim);
        riskScore += frequencyRisk.score;
        if (frequencyRisk.indicators.length > 0) {
            fraudIndicators.push(...frequencyRisk.indicators);
        }

        // 3. Pattern-based risk factors
        const patternRisk = await analyzeClaimPatterns(claim);
        riskScore += patternRisk.score;
        if (patternRisk.indicators.length > 0) {
            fraudIndicators.push(...patternRisk.indicators);
        }

        // 4. Hospital/Provider risk factors
        const providerRisk = await analyzeProviderHistory(claim);
        riskScore += providerRisk.score;
        if (providerRisk.indicators.length > 0) {
            fraudIndicators.push(...providerRisk.indicators);
        }

        // 5. Document consistency check
        const documentRisk = await analyzeDocumentConsistency(claim);
        riskScore += documentRisk.score;
        if (documentRisk.indicators.length > 0) {
            fraudIndicators.push(...documentRisk.indicators);
        }

        // Normalize risk score (0-100)
        const normalizedScore = Math.min(100, Math.max(0, riskScore));

        // Determine risk level
        const riskLevel = getRiskLevel(normalizedScore);

        // Flag for review if high risk
        const flaggedForReview = normalizedScore >= 60;

        // Log fraud detection result
        await FraudDetectionLog.create({
            claim_id: claim.claim_id,
            risk_score: normalizedScore,
            risk_level: riskLevel,
            fraud_indicators: fraudIndicators,
            ai_model_version: '1.0.0',
            flagged_for_review: flaggedForReview
        });

        logger.info(`Fraud detection completed for claim ${claim.claim_id}: Score=${normalizedScore}, Level=${riskLevel}`);

        return {
            riskScore: normalizedScore,
            riskLevel,
            flaggedForReview,
            indicators: fraudIndicators,
            recommendation: getRecommendation(normalizedScore, fraudIndicators)
        };

    } catch (error) {
        logger.error('Error in fraud detection:', error);
        return {
            riskScore: 0,
            riskLevel: 'UNKNOWN',
            flaggedForReview: false,
            indicators: [],
            recommendation: 'Manual review recommended due to analysis error'
        };
    }
};

/**
 * Analyze claim amount for suspicious patterns
 */
const analyzeClaimAmount = (claim) => {
    let score = 0;
    const indicators = [];

    const claimAmount = parseFloat(claim.claim_amount);
    const policyRemaining = parseFloat(claim.policy?.remaining_amount || 0);
    const policyCoverage = parseFloat(claim.policy?.coverage_amount || 0);

    // Check if claim is for exact policy limit (suspicious)
    if (claimAmount === policyRemaining) {
        score += 15;
        indicators.push({
            type: 'EXACT_LIMIT_CLAIM',
            severity: 'MEDIUM',
            description: 'Claim amount exactly matches remaining policy limit'
        });
    }

    // Check if claim is unusually high (>80% of remaining)
    if (claimAmount > policyRemaining * 0.8) {
        score += 20;
        indicators.push({
            type: 'HIGH_AMOUNT_CLAIM',
            severity: 'HIGH',
            description: 'Claim amount is unusually high (>80% of remaining coverage)'
        });
    }

    // Check for round numbers (often fabricated)
    if (claimAmount % 10000 === 0 && claimAmount >= 50000) {
        score += 10;
        indicators.push({
            type: 'ROUND_NUMBER',
            severity: 'LOW',
            description: 'Claim amount is a suspiciously round number'
        });
    }

    return { score, indicators };
};

/**
 * Analyze claim frequency patterns
 */
const analyzeClaimFrequency = async (claim) => {
    let score = 0;
    const indicators = [];

    try {
        const { ClaimRequest } = require('../models');
        
        // Get claims from same customer in last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentClaims = await ClaimRequest.count({
            where: {
                customer_id: claim.customer_id,
                created_at: {
                    [require('sequelize').Op.gte]: sixMonthsAgo
                }
            }
        });

        // High frequency of claims
        if (recentClaims > 5) {
            score += 25;
            indicators.push({
                type: 'HIGH_FREQUENCY',
                severity: 'HIGH',
                description: `${recentClaims} claims in last 6 months (unusually high)`
            });
        } else if (recentClaims > 3) {
            score += 15;
            indicators.push({
                type: 'MODERATE_FREQUENCY',
                severity: 'MEDIUM',
                description: `${recentClaims} claims in last 6 months`
            });
        }

        // Check for claims in quick succession
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const veryRecentClaims = await ClaimRequest.count({
            where: {
                customer_id: claim.customer_id,
                created_at: {
                    [require('sequelize').Op.gte]: lastMonth
                }
            }
        });

        if (veryRecentClaims > 2) {
            score += 20;
            indicators.push({
                type: 'RAPID_SUCCESSION',
                severity: 'HIGH',
                description: 'Multiple claims in last 30 days'
            });
        }

    } catch (error) {
        logger.error('Error analyzing claim frequency:', error);
    }

    return { score, indicators };
};

/**
 * Analyze claim patterns for anomalies
 */
const analyzeClaimPatterns = async (claim) => {
    let score = 0;
    const indicators = [];

    try {
        // Check treatment duration
        if (claim.admission_date && claim.discharge_date) {
            const admissionDate = new Date(claim.admission_date);
            const dischargeDate = new Date(claim.discharge_date);
            const durationDays = Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24));

            // Very short hospitalization for high claim amount
            if (durationDays <= 1 && parseFloat(claim.claim_amount) > 100000) {
                score += 20;
                indicators.push({
                    type: 'SHORT_STAY_HIGH_COST',
                    severity: 'HIGH',
                    description: 'High claim amount for very short hospital stay'
                });
            }

            // Unusually long hospitalization
            if (durationDays > 30) {
                score += 10;
                indicators.push({
                    type: 'EXTENDED_STAY',
                    severity: 'MEDIUM',
                    description: 'Unusually long hospitalization period'
                });
            }
        }

        // Check if claim submitted very close to policy expiry
        if (claim.policy?.policy_end_date) {
            const policyEndDate = new Date(claim.policy.policy_end_date);
            const claimDate = new Date(claim.created_at);
            const daysToExpiry = Math.ceil((policyEndDate - claimDate) / (1000 * 60 * 60 * 24));

            if (daysToExpiry <= 30 && daysToExpiry >= 0) {
                score += 15;
                indicators.push({
                    type: 'NEAR_EXPIRY_CLAIM',
                    severity: 'MEDIUM',
                    description: 'Claim submitted close to policy expiry date'
                });
            }
        }

        // Check for weekend/holiday admissions (statistically more fraudulent)
        if (claim.admission_date) {
            const admissionDate = new Date(claim.admission_date);
            const dayOfWeek = admissionDate.getDay();
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                score += 5;
                indicators.push({
                    type: 'WEEKEND_ADMISSION',
                    severity: 'LOW',
                    description: 'Admission on weekend (requires verification)'
                });
            }
        }

    } catch (error) {
        logger.error('Error analyzing claim patterns:', error);
    }

    return { score, indicators };
};

/**
 * Analyze provider/hospital history
 */
const analyzeProviderHistory = async (claim) => {
    let score = 0;
    const indicators = [];

    try {
        const { ClaimRequest } = require('../models');

        if (claim.hospital_name) {
            // Check claims from same hospital
            const hospitalClaims = await ClaimRequest.count({
                where: {
                    hospital_name: claim.hospital_name,
                    status: ['REJECTED', 'UNDER_REVIEW']
                }
            });

            // High rejection rate from this hospital
            if (hospitalClaims > 10) {
                score += 20;
                indicators.push({
                    type: 'HIGH_RISK_PROVIDER',
                    severity: 'HIGH',
                    description: 'Hospital has high number of rejected/suspicious claims'
                });
            }
        }

    } catch (error) {
        logger.error('Error analyzing provider history:', error);
    }

    return { score, indicators };
};

/**
 * Analyze document consistency
 */
const analyzeDocumentConsistency = async (claim) => {
    let score = 0;
    const indicators = [];

    try {
        const { ClaimDocument } = require('../models');

        // Check if all mandatory documents are uploaded
        const documents = await ClaimDocument.findAll({
            where: { claim_id: claim.claim_id }
        });

        if (documents.length < 4) {
            score += 15;
            indicators.push({
                type: 'INSUFFICIENT_DOCUMENTS',
                severity: 'MEDIUM',
                description: 'Fewer documents than typically required'
            });
        }

        // Check for documents uploaded all at once (suspicious)
        if (documents.length > 0) {
            const uploadTimes = documents.map(d => new Date(d.uploaded_at).getTime());
            const timeSpan = Math.max(...uploadTimes) - Math.min(...uploadTimes);
            
            // All documents uploaded within 5 minutes
            if (timeSpan < 5 * 60 * 1000 && documents.length >= 5) {
                score += 10;
                indicators.push({
                    type: 'BULK_UPLOAD',
                    severity: 'LOW',
                    description: 'All documents uploaded simultaneously (verify authenticity)'
                });
            }
        }

    } catch (error) {
        logger.error('Error analyzing document consistency:', error);
    }

    return { score, indicators };
};

/**
 * Determine risk level based on score
 */
const getRiskLevel = (score) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
};

/**
 * Get recommendation based on risk assessment
 */
const getRecommendation = (score, indicators) => {
    if (score >= 80) {
        return 'REJECT - Critical fraud indicators detected. Recommend thorough investigation.';
    }
    if (score >= 60) {
        return 'HOLD - High risk detected. Require additional verification and documentation.';
    }
    if (score >= 40) {
        return 'REVIEW - Moderate risk. Recommend detailed auditor review before approval.';
    }
    if (score >= 20) {
        return 'CAUTION - Low risk detected. Standard review process recommended.';
    }
    return 'APPROVE - Minimal risk detected. Can proceed with standard approval process.';
};

/**
 * Get fraud detection report for a claim
 */
const getFraudDetectionReport = async (claimId) => {
    try {
        const report = await FraudDetectionLog.findOne({
            where: { claim_id: claimId },
            order: [['created_at', 'DESC']]
        });

        return report;
    } catch (error) {
        logger.error('Error fetching fraud detection report:', error);
        return null;
    }
};

/**
 * Batch analyze multiple claims
 */
const batchAnalyzeClaims = async (claimIds) => {
    const results = [];
    
    for (const claimId of claimIds) {
        try {
            const { ClaimRequest } = require('../models');
            const claim = await ClaimRequest.findByPk(claimId, {
                include: ['policy']
            });
            
            if (claim) {
                const result = await calculateRiskScore(claim);
                results.push({
                    claimId,
                    ...result
                });
            }
        } catch (error) {
            logger.error(`Error analyzing claim ${claimId}:`, error);
        }
    }
    
    return results;
};

module.exports = {
    calculateRiskScore,
    getFraudDetectionReport,
    batchAnalyzeClaims
};

// Made with Bob
