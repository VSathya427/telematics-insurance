const express = require('express');
const pricingEngine = require('../services/pricingEngine');
const auth = require('../middleware/auth');
const router = express.Router();

// Get current premium calculation
router.get('/premium', auth, async (req, res) => {
    try {
        const { coverageType = 'full' } = req.query;
        const pricingBreakdown = await pricingEngine.calculatePremium(req.userId, coverageType);

        res.json({
            message: 'Premium calculated successfully',
            ...pricingBreakdown
        });

    } catch (error) {
        res.status(500).json({ message: 'Error calculating premium', error: error.message });
    }
});

// Generate insurance quote
router.post('/quote', async (req, res) => {
    try {
        const { userData, vehicleData, coveragePreferences } = req.body;

        const quote = await pricingEngine.generateQuote(
            userData,
            vehicleData,
            coveragePreferences
        );

        res.json({
            message: 'Quote generated successfully',
            ...quote
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating quote', error: error.message });
    }
});

// Compare pricing options
router.post('/compare', auth, async (req, res) => {
    try {
        const coverageTypes = ['liability', 'collision', 'full'];
        const comparisons = {};

        for (const type of coverageTypes) {
            comparisons[type] = await pricingEngine.calculatePremium(req.userId, type);
        }

        res.json({
            message: 'Pricing comparison completed',
            comparisons,
            recommendation: getRecommendation(comparisons)
        });

    } catch (error) {
        res.status(500).json({ message: 'Error comparing prices', error: error.message });
    }
});

function getRecommendation(comparisons) {
    const full = comparisons.full;
    const collision = comparisons.collision;

    if (full.finalPremium - collision.finalPremium < 100) {
        return {
            recommended: 'full',
            reason: 'Full coverage offers great value for minimal additional cost'
        };
    }

    return {
        recommended: 'collision',
        reason: 'Collision coverage provides good protection at a reasonable price'
    };
}

// routes/pricing.js
router.get('/premium-hybrid', auth, async (req, res) => {
    try {
        const riskScoringService = require('../services/riskScoring');
        const pricingEngine = require('../services/pricingEngine');

        // Get hybrid risk score
        const hybridRisk = await riskScoringService.calculateHybridRiskScore(req.userId);

        // Calculate premium with hybrid risk
        const premium = await pricingEngine.calculatePremiumWithHybridRisk(
            req.userId,
            req.query.coverageType || 'full',
            hybridRisk
        );

        res.json({
            success: true,
            ...premium
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error calculating hybrid premium',
            error: error.message
        });
    }
});


// Get premium history and trends
router.get('/history', auth, async (req, res) => {
    try {
        const Policy = require('../models/Policy');
        const policies = await Policy.find({ userId: req.userId })
            .select('premiumHistory currentPremium policyNumber')
            .sort({ createdAt: -1 });

        const history = policies.map(policy => ({
            policyNumber: policy.policyNumber,
            currentPremium: policy.currentPremium,
            history: policy.premiumHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
        }));

        res.json({
            message: 'Premium history retrieved successfully',
            history
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching premium history', error: error.message });
    }
});

module.exports = router;
