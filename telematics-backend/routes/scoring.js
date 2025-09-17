const express = require('express');
const riskScoringService = require('../services/riskScoring');
const auth = require('../middleware/auth');
const cache = require('../services/cacheService');
const router = express.Router();


// Update user risk score
router.post('/update-risk-score', auth, async (req, res) => {
    try {
        const riskScore = await riskScoringService.updateUserRiskScore(req.userId);

        res.json({
            message: 'Risk score updated successfully',
            riskScore
        });

    } catch (error) {
        res.status(500).json({ message: 'Error updating risk score', error: error.message });
    }
});

// Get detailed risk analysis
router.get('/risk-analysis', auth, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const analysis = await riskScoringService.calculateRiskScore(req.userId, parseInt(days));

        // Add recommendations based on risk factors
        const recommendations = generateRecommendations(analysis.factors);

        res.json({
            ...analysis,
            recommendations
        });

    } catch (error) {
        res.status(500).json({ message: 'Error performing risk analysis', error: error.message });
    }
});

const integratedMLScoring = require('../services/integratedMLScoring');

// Replace existing risk-score endpoint
router.get('/risk-score', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 180;
        const result = await integratedMLScoring.calculateRiskScore(req.userId, days);

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
            userId: req.userId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error calculating integrated risk score',
            error: error.message
        });
    }
});

// In routes/scoring.js
router.get('/risk-trend-ml', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 180;

        // Check cache first
        const cachedTrend = cache.get(req.userId, days, 'risk-trend-ml');
        if (cachedTrend) {
            return res.json({
                success: true,
                ...cachedTrend,
                fromCache: true
            });
        }

        console.log(`🔄 Generating fresh ML risk trend for ${days} days`);

        const weeks = Math.ceil(days / 7);
        const weeklyTrends = [];

        for (let week = 0; week < Math.min(weeks, 26); week++) { // Limit to 26 weeks max
            const weekDays = Math.min(days - (week * 7), 7);
            if (weekDays <= 0) break;

            const weekResult = await integratedMLScoring.calculateRiskScore(req.userId, weekDays + (week * 7));

            weeklyTrends.push({
                week: weeks - week,
                riskScore: weekResult.riskScore,
                method: weekResult.method,
                confidence: weekResult.confidence,
                mlScore: weekResult.mlScore,
                traditionalScore: weekResult.traditionalScore
            });
        }

        const result = {
            trend: weeklyTrends.reverse(),
            period: `${days} days`,
            dataPoints: weeklyTrends.length,
            generatedAt: new Date().toISOString()
        };

        // Cache for 15 minutes (longer since trends change less frequently)
        cache.set(req.userId, days, result, 'risk-trend-ml', 15);

        res.json({
            success: true,
            ...result,
            fromCache: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error calculating ML risk trend',
            error: error.message
        });
    }
});

// Add this new endpoint for driving statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        // Check cache first
        const cachedStats = cache.get(req.userId, days, 'driving-stats');
        if (cachedStats) {
            return res.json({
                success: true,
                ...cachedStats,
                fromCache: true
            });
        }

        console.log(`🔄 Calculating driving stats for ${days} days`);

        // Get telemetry data from MongoDB
        const TelematicsData = require('../models/TelematicsData');
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const telematryData = await TelematicsData.find({
            userId: req.userId,
            timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: -1 });

        if (telematryData.length === 0) {
            return res.json({
                success: true,
                stats: {
                    totalDistance: 0,
                    averageSpeed: 0,
                    harshEvents: 0,
                    nightDrivingPercentage: 0,
                    totalTrips: 0,
                    weeklyPattern: {
                        Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
                        Thursday: 0, Friday: 0, Saturday: 0
                    },
                    hourlyPattern: new Array(24).fill(0)
                },
                fromCache: false
            });
        }

        // Calculate statistics
        const uniqueTrips = [...new Set(telematryData.map(d => d.tripId))];
        const totalTrips = uniqueTrips.length;

        // Calculate total distance (estimate from trips)
        const avgTripDistance = 8 + Math.random() * 12; // 8-20 miles per trip
        const totalDistance = Math.round(totalTrips * avgTripDistance);

        // Calculate average speed
        const speeds = telematryData.map(d => d.speed).filter(s => s > 0);
        const averageSpeed = speeds.length > 0 ?
            Math.round(speeds.reduce((sum, s) => sum + s, 0) / speeds.length) : 0;

        // Calculate harsh events
        const harshEvents = telematryData.filter(d =>
            d.events && (d.events.harshBraking || d.events.harshAcceleration || d.events.harshTurning)
        ).length;

        // Calculate night driving
        const nightEvents = telematryData.filter(d => {
            const hour = new Date(d.timestamp).getHours();
            return hour < 6 || hour > 22;
        }).length;
        const nightDrivingPercentage = telematryData.length > 0 ?
            Math.round((nightEvents / telematryData.length) * 100) : 0;

        // Calculate weekly pattern
        const weeklyPattern = {
            Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
            Thursday: 0, Friday: 0, Saturday: 0
        };

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        uniqueTrips.forEach(tripId => {
            const tripData = telematryData.filter(d => d.tripId === tripId);
            if (tripData.length > 0) {
                const dayOfWeek = new Date(tripData[0].timestamp).getDay();
                weeklyPattern[dayNames[dayOfWeek]]++;
            }
        });

        // Calculate hourly pattern
        const hourlyPattern = new Array(24).fill(0);
        telematryData.forEach(d => {
            const hour = new Date(d.timestamp).getHours();
            hourlyPattern[hour]++;
        });

        const stats = {
            totalDistance,
            averageSpeed,
            harshEvents,
            nightDrivingPercentage,
            totalTrips,
            weeklyPattern,
            hourlyPattern,
            dataPoints: telematryData.length,
            period: `${days} days`
        };

        // Cache for 5 minutes
        cache.set(req.userId, days, { stats }, 'driving-stats', 5);

        res.json({
            success: true,
            stats,
            fromCache: false
        });
    } catch (error) {
        console.error('❌ Stats calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating driving stats',
            error: error.message
        });
    }
});




function generateRecommendations(factors) {
    const recommendations = [];

    if (factors.speedViolations && factors.speedViolations.rate > 0.1) {
        recommendations.push({
            category: 'Speed Management',
            priority: 'High',
            message: 'Reduce speeding violations to improve your score',
            impact: 'Could save up to $200/year'
        });
    }

    if (factors.harshEvents && factors.harshEvents.rate > 0.05) {
        recommendations.push({
            category: 'Smooth Driving',
            priority: 'Medium',
            message: 'Focus on smoother acceleration and braking',
            impact: 'Could save up to $150/year'
        });
    }

    if (factors.phoneUsage && factors.phoneUsage.rate > 0.02) {
        recommendations.push({
            category: 'Distracted Driving',
            priority: 'High',
            message: 'Avoid phone usage while driving',
            impact: 'Could save up to $300/year'
        });
    }

    if (factors.timeOfDay && factors.timeOfDay.nightDrivingRate > 0.3) {
        recommendations.push({
            category: 'Drive Time',
            priority: 'Low',
            message: 'Consider reducing night driving when possible',
            impact: 'Could save up to $75/year'
        });
    }

    return recommendations;
}

module.exports = router;
