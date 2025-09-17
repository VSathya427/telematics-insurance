const TelematicsData = require('../models/TelematicsData');
const ss = require('simple-statistics');
const mlScoringService = require('./integratedMLScoring');

class RiskScoringService {
    constructor() {
        this.weights = {
            speedViolations: 0.25,
            harshEvents: 0.20,
            mileage: 0.15,
            timeOfDay: 0.10,
            weatherRisk: 0.10,
            locationRisk: 0.10,
            phoneUsage: 0.10
        };
    }

    async calculateRiskScore(userId, days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

            const telematicsData = await TelematicsData.find({
                userId,
                timestamp: { $gte: startDate, $lte: endDate }
            }).sort({ timestamp: -1 });

            if (telematicsData.length === 0) {
                return { riskScore: 50, factors: {} };
            }

            const factors = await this.analyzeDrivingFactors(telematicsData);
            const riskScore = this.calculateCompositeScore(factors);

            return {
                riskScore: Math.min(Math.max(riskScore, 0), 100),
                factors,
                dataPoints: telematicsData.length,
                period: `${days} days`
            };

        } catch (error) {
            console.error('Error calculating risk score:', error);
            throw error;
        }
    }

    async analyzeDrivingFactors(data) {
        const speeds = data.map(d => d.speed);
        const timestamps = data.map(d => d.timestamp);

        return {
            speedViolations: this.analyzeSpeedViolations(speeds),
            harshEvents: this.analyzeHarshEvents(data),
            mileage: this.analyzeMileage(data),
            timeOfDay: this.analyzeTimeOfDay(timestamps),
            weatherRisk: this.analyzeWeatherRisk(data),
            locationRisk: this.analyzeLocationRisk(data),
            phoneUsage: this.analyzePhoneUsage(data)
        };
    }

    analyzeSpeedViolations(speeds) {
        const speedLimit = 65; // Assume 65 mph average speed limit
        const violations = speeds.filter(speed => speed > speedLimit);
        const violationRate = violations.length / speeds.length;
        const avgExcess = violations.length > 0 ?
            ss.mean(violations.map(speed => speed - speedLimit)) : 0;

        return {
            rate: violationRate,
            avgExcess,
            score: Math.min(violationRate * 100 + avgExcess * 2, 100)
        };
    }

    analyzeHarshEvents(data) {
        const harshBraking = data.filter(d => d.events.harshBraking).length;
        const harshAcceleration = data.filter(d => d.events.harshAcceleration).length;
        const harshTurning = data.filter(d => d.events.harshTurning).length;

        const totalEvents = harshBraking + harshAcceleration + harshTurning;
        const eventRate = totalEvents / data.length;

        return {
            harshBraking,
            harshAcceleration,
            harshTurning,
            rate: eventRate,
            score: Math.min(eventRate * 1000, 100)
        };
    }

    analyzeMileage(data) {
        // Estimate distance based on speed and time intervals
        let totalDistance = 0;
        for (let i = 1; i < data.length; i++) {
            const timeDiff = (data[i - 1].timestamp - data[i].timestamp) / (1000 * 60 * 60); // hours
            const avgSpeed = (data[i - 1].speed + data[i].speed) / 2;
            totalDistance += avgSpeed * Math.abs(timeDiff);
        }

        const dailyMileage = totalDistance / 30; // Assume 30-day period

        return {
            totalDistance,
            dailyMileage,
            score: Math.min((dailyMileage / 50) * 100, 100) // 50 miles/day = 100% score
        };
    }

    analyzeTimeOfDay(timestamps) {
        const nightHours = timestamps.filter(ts => {
            const hour = new Date(ts).getHours();
            return hour >= 22 || hour <= 5; // 10 PM to 5 AM
        }).length;

        const nightDrivingRate = nightHours / timestamps.length;

        return {
            nightDrivingRate,
            score: nightDrivingRate * 50 // Night driving increases risk
        };
    }

    analyzeWeatherRisk(data) {
        const highRiskWeather = data.filter(d =>
            d.weather && d.weather.roadRisk > 0.7
        ).length;

        const riskRate = highRiskWeather / data.length;

        return {
            highRiskTrips: highRiskWeather,
            rate: riskRate,
            score: riskRate * 30
        };
    }

    analyzeLocationRisk(data) {
        // Simple location risk based on speed patterns
        const cityDriving = data.filter(d => d.roadType === 'city').length;
        const highwayDriving = data.filter(d => d.roadType === 'highway').length;

        const cityRate = cityDriving / data.length;
        const highwayRate = highwayDriving / data.length;

        return {
            cityRate,
            highwayRate,
            score: cityRate * 20 + highwayRate * 10 // City driving slightly riskier
        };
    }

    analyzePhoneUsage(data) {
        const phoneUsageEvents = data.filter(d => d.events.phoneUsage).length;
        const usageRate = phoneUsageEvents / data.length;

        return {
            events: phoneUsageEvents,
            rate: usageRate,
            score: usageRate * 200 // Phone usage is high risk
        };
    }

    calculateCompositeScore(factors) {
        let score = 0;

        score += factors.speedViolations.score * this.weights.speedViolations;
        score += factors.harshEvents.score * this.weights.harshEvents;
        score += factors.mileage.score * this.weights.mileage;
        score += factors.timeOfDay.score * this.weights.timeOfDay;
        score += factors.weatherRisk.score * this.weights.weatherRisk;
        score += factors.locationRisk.score * this.weights.locationRisk;
        score += factors.phoneUsage.score * this.weights.phoneUsage;

        return Math.round(score);
    }

    async updateUserRiskScore(userId) {
        try {
            const { riskScore } = await this.calculateRiskScore(userId);
            const User = require('../models/User');

            await User.findByIdAndUpdate(userId, { riskScore });
            return riskScore;

        } catch (error) {
            console.error('Error updating user risk score:', error);
            throw error;
        }
    }

    async calculateHybridRiskScore(userId, days = 30) {
        try {
            // Get traditional risk score
            const traditionalResult = await this.calculateRiskScore(userId, days);

            // Get telematics data for ML
            const telematicsData = await this.getTelematicsData(userId, days);

            // Try ML prediction
            const mlResult = await mlScoringService.predictRisk(telematicsData);

            let finalScore, method, confidence;

            if (mlResult.useML && mlResult.confidence > 0.7) {
                // Use ML score with high confidence
                finalScore = mlResult.mlRiskScore;
                method = 'ml';
                confidence = mlResult.confidence;

                // Blend with traditional score for stability
                const blendWeight = Math.min(mlResult.confidence, 0.8);
                finalScore = (finalScore * blendWeight) + (traditionalResult.riskScore * (1 - blendWeight));

            } else {
                // Fall back to traditional scoring
                finalScore = traditionalResult.riskScore;
                method = 'traditional';
                confidence = 0.9; // Traditional method is reliable
            }

            return {
                riskScore: Math.round(finalScore),
                method,
                confidence,
                mlAvailable: mlResult.useML,
                factors: traditionalResult.factors,
                mlInsights: mlResult.useML ? {
                    mlRiskScore: mlResult.mlRiskScore,
                    riskLevel: mlResult.riskLevel
                } : null
            };

        } catch (error) {
            console.error('Hybrid scoring error:', error);
            // Fallback to traditional scoring
            const result = await this.calculateRiskScore(userId, days);
            return { ...result, method: 'traditional_fallback', confidence: 0.9 };
        }
    }

    async getTelematicsData(userId, days) {
        const TelematicsData = require('../models/TelematicsData');
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        return await TelematicsData.find({
            userId,
            timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: -1 }).limit(1000);
    }

}

module.exports = new RiskScoringService();
