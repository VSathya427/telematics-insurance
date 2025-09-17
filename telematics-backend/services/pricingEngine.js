const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

class PricingEngine {
    constructor() {
        // Base premium rates by coverage type (monthly)
        this.basePremiumRates = {
            basic: 85,
            standard: 125,
            full: 175,
            premium: 225
        };

        // Demographic factors
        this.demographicMultipliers = {
            age: {
                under25: 1.4,
                age25to35: 1.1,
                age35to55: 0.9,
                over55: 1.0
            },
            experience: {
                under2years: 1.3,
                years2to5: 1.1,
                years5to10: 0.95,
                over10years: 0.85
            }
        };
    }

    calculateRiskMultiplier(riskScore) {
        // Risk score is 0-100, lower is better
        if (riskScore <= 20) return 0.75;  // Excellent driver - 25% discount
        if (riskScore <= 40) return 0.90;  // Good driver - 10% discount
        if (riskScore <= 60) return 1.00;  // Average driver - no change
        if (riskScore <= 80) return 1.25;  // Poor driver - 25% increase
        return 1.50;                       // High risk - 50% increase
    }

    calculateUsageMultiplier(mileage, nightDrivingPercentage = 0) {
        let multiplier = 1.0;

        // Annual mileage factor
        if (mileage < 5000) multiplier *= 0.90;      // Low mileage discount
        else if (mileage > 15000) multiplier *= 1.15; // High mileage surcharge

        // Night driving factor (higher risk)
        if (nightDrivingPercentage > 30) {
            multiplier *= (1 + nightDrivingPercentage / 200); // Up to 50% increase
        }

        return multiplier;
    }

    async getDemographicMultiplier(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return 1.0;

            const age = this.calculateAge(user.dateOfBirth);
            const licenseAge = this.calculateLicenseAge(user.licenseIssueDate);

            // Age multiplier
            let ageMultiplier = 1.0;
            if (age < 25) ageMultiplier = this.demographicMultipliers.age.under25;
            else if (age < 35) ageMultiplier = this.demographicMultipliers.age.age25to35;
            else if (age < 55) ageMultiplier = this.demographicMultipliers.age.age35to55;
            else ageMultiplier = this.demographicMultipliers.age.over55;

            // Experience multiplier
            let experienceMultiplier = 1.0;
            if (licenseAge < 2) experienceMultiplier = this.demographicMultipliers.experience.under2years;
            else if (licenseAge < 5) experienceMultiplier = this.demographicMultipliers.experience.years2to5;
            else if (licenseAge < 10) experienceMultiplier = this.demographicMultipliers.experience.years5to10;
            else experienceMultiplier = this.demographicMultipliers.experience.over10years;

            return (ageMultiplier + experienceMultiplier) / 2; // Average the two factors
        } catch (error) {
            console.error('Error calculating demographic multiplier:', error);
            return 1.0; // Default multiplier if error
        }
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    calculateLicenseAge(licenseIssueDate) {
        if (!licenseIssueDate) return 5; // Default to 5 years if unknown

        const today = new Date();
        const issueDate = new Date(licenseIssueDate);
        return (today - issueDate) / (365.25 * 24 * 60 * 60 * 1000); // Years
    }

    async calculatePremiumWithHybridRisk(userId, coverageType = 'full', hybridRiskData) {
        try {
            // Get base premium for coverage type
            const basePremium = this.basePremiumRates[coverageType] || this.basePremiumRates.full;

            // Use hybrid risk score instead of traditional
            const riskScore = hybridRiskData.riskScore;
            const riskMultiplier = this.calculateRiskMultiplier(riskScore);

            // Get demographic multiplier
            const demographicMultiplier = await this.getDemographicMultiplier(userId);

            // Calculate usage multiplier (from stats if available)
            let usageMultiplier = 1.0;
            if (hybridRiskData.factors && hybridRiskData.factors.mileage) {
                usageMultiplier = this.calculateUsageMultiplier(
                    hybridRiskData.factors.mileage,
                    hybridRiskData.factors.nightDrivingPercentage || 0
                );
            }

            // Calculate premium components
            let preliminaryPremium = basePremium * riskMultiplier * demographicMultiplier * usageMultiplier;

            // Apply discounts for low-risk drivers
            let discountRate = 0;
            if (riskScore <= 20) discountRate = 0.15;      // 15% discount for excellent drivers
            else if (riskScore <= 30) discountRate = 0.10; // 10% discount for very good drivers
            else if (riskScore <= 40) discountRate = 0.05; // 5% discount for good drivers

            // ML confidence bonus - additional small discount if ML is confident
            if (hybridRiskData.method === 'ml' && hybridRiskData.confidence > 0.85) {
                discountRate += 0.02; // 2% additional discount for high-confidence ML
            }

            // Calculate final premium
            const finalPremium = preliminaryPremium * (1 - discountRate);
            const potentialSavings = basePremium - finalPremium;

            return {
                basePremium: Math.round(basePremium * 100) / 100,
                finalPremium: Math.round(finalPremium * 100) / 100,
                potentialSavings: Math.round(Math.max(0, potentialSavings) * 100) / 100,
                riskScore,
                riskMultiplier: Math.round(riskMultiplier * 1000) / 1000,
                demographicMultiplier: Math.round(demographicMultiplier * 1000) / 1000,
                usageMultiplier: Math.round(usageMultiplier * 1000) / 1000,
                discountRate: Math.round(discountRate * 1000) / 1000,
                scoringMethod: hybridRiskData.method,
                confidence: hybridRiskData.confidence,
                mlEnhanced: hybridRiskData.method === 'ml',
                coverageType,
                calculatedAt: new Date().toISOString(),

                // Breakdown for transparency
                breakdown: {
                    basePremium,
                    afterRiskAdjustment: basePremium * riskMultiplier,
                    afterDemographics: basePremium * riskMultiplier * demographicMultiplier,
                    afterUsage: preliminaryPremium,
                    afterDiscounts: finalPremium
                }
            };

        } catch (error) {
            console.error('Error calculating premium with hybrid risk:', error);

            // Fallback to simple calculation
            const basePremium = this.basePremiumRates[coverageType] || this.basePremiumRates.full;
            const riskMultiplier = this.calculateRiskMultiplier(hybridRiskData.riskScore);
            const finalPremium = basePremium * riskMultiplier;

            return {
                basePremium,
                finalPremium: Math.round(finalPremium * 100) / 100,
                potentialSavings: 0,
                riskScore: hybridRiskData.riskScore,
                riskMultiplier,
                demographicMultiplier: 1.0,
                usageMultiplier: 1.0,
                discountRate: 0,
                scoringMethod: 'fallback',
                confidence: 0.5,
                mlEnhanced: false,
                coverageType,
                calculatedAt: new Date().toISOString(),
                error: 'Used fallback calculation due to error'
            };
        }
    }

    // Traditional premium calculation (for comparison/fallback)
    async calculatePremium(userId, coverageType = 'full') {
        const riskScoringService = require('./riskScoringService');
        const riskResult = await riskScoringService.calculateRiskScore(userId);

        return this.calculatePremiumWithHybridRisk(userId, coverageType, {
            riskScore: riskResult.riskScore,
            method: 'traditional',
            confidence: 0.9,
            factors: riskResult.factors
        });
    }
}

module.exports = new PricingEngine();
