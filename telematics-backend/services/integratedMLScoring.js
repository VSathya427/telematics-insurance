const { spawn } = require('child_process');
const path = require('path');
const TelematicsData = require('../models/TelematicsData');
const cache = require('../services/cacheService'); 

class IntegratedMLScoring {
    constructor() {
        this.mlModelPath = path.join(__dirname, '../ml_service/predict.py');
    }

    async calculateRiskScore(userId, days = 180) {
        try {
            // Check cache first
            const cacheKey = 'risk-score';
            const cachedResult = cache.get(userId, days, cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            console.log(`🔄 Computing fresh ML risk score for user ${userId}`);

            // Existing calculation logic...
            const telemetryData = await this.getTelemetryData(userId, days);

            if (telemetryData.length < 50) {
                return {
                    riskScore: 50,
                    method: 'insufficient_data',
                    confidence: 0.5,
                    message: 'Need more driving data for accurate scoring'
                };
            }

            const traditionalScore = this.calculateTraditionalScore(telemetryData);
            const mlFeatures = this.extractMLFeatures(telemetryData);
            const mlResult = await this.runMLPrediction(mlFeatures);

            let finalScore, method, confidence;

            if (mlResult && mlResult.confidence >= 0.7) {
                const blendWeight = Math.min(mlResult.confidence, 0.8);
                finalScore = (mlResult.risk_score * blendWeight) + (traditionalScore * (1 - blendWeight));
                method = 'ml_enhanced';
                confidence = mlResult.confidence;
            } else {
                finalScore = traditionalScore;
                method = 'traditional_fallback';
                confidence = 0.9;
            }

            const result = {
                riskScore: Math.round(finalScore),
                method,
                confidence,
                mlScore: mlResult?.risk_score || null,
                traditionalScore,
                factors: this.analyzeRiskFactors(telemetryData),
                telemetrySummary: this.summarizeTelemetry(telemetryData),
                dataQuality: {
                    totalDataPoints: telemetryData.length,
                    timeSpan: days,
                    sufficientData: telemetryData.length >= 100
                },
                generatedAt: new Date().toISOString()
            };

            // Cache the result for 10 minutes
            cache.set(userId, days, result, cacheKey, 10);

            return result;

        } catch (error) {
            console.error('❌ Risk scoring error:', error);
            throw error;
        }
    }

    async getTelemetryData(userId, days) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        return await TelematicsData.find({
            userId,
            timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: -1 });
    }

    calculateTraditionalScore(data) {
        if (!data.length) return 50;

        let riskScore = 30; // Base score for good driver

        // Speed analysis
        const speeds = data.map(d => d.speed);
        const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
        const maxSpeed = Math.max(...speeds);
        const speedingEvents = speeds.filter(s => s > 70).length;

        // Event analysis
        const harshBrakingEvents = data.filter(d => d.events.harshBraking).length;
        const harshAccelEvents = data.filter(d => d.events.harshAcceleration).length;
        const harshTurningEvents = data.filter(d => d.events.harshTurning).length;
        const phoneUsageEvents = data.filter(d => d.events.phoneUsage).length;

        // Time-based analysis
        const nightDrivingEvents = data.filter(d => {
            const hour = new Date(d.timestamp).getHours();
            return hour < 6 || hour > 22;
        }).length;

        // Weather-based analysis
        const badWeatherEvents = data.filter(d =>
            d.weather && d.weather.roadRisk > 0.5
        ).length;

        // Apply penalties
        riskScore += (avgSpeed - 45) * 0.5; // Speed penalty
        riskScore += (speedingEvents / data.length) * 100; // Speeding penalty
        riskScore += (harshBrakingEvents / data.length) * 80;
        riskScore += (harshAccelEvents / data.length) * 70;
        riskScore += (harshTurningEvents / data.length) * 60;
        riskScore += (phoneUsageEvents / data.length) * 120;
        riskScore += (nightDrivingEvents / data.length) * 25;
        riskScore += (badWeatherEvents / data.length) * 35;

        return Math.min(100, Math.max(0, riskScore));
    }

    extractMLFeatures(data) {
        const speeds = data.map(d => d.speed);
        const totalTrips = new Set(data.map(d => d.tripId)).size;

        return {
            // Speed features
            avg_speed: speeds.reduce((sum, s) => sum + s, 0) / speeds.length,
            max_speed: Math.max(...speeds),
            speed_variance: this.calculateVariance(speeds),
            speeding_rate: speeds.filter(s => s > 70).length / speeds.length,

            // Event features
            harsh_braking_rate: data.filter(d => d.events.harshBraking).length / data.length,
            harsh_accel_rate: data.filter(d => d.events.harshAcceleration).length / data.length,
            harsh_turning_rate: data.filter(d => d.events.harshTurning).length / data.length,
            phone_usage_rate: data.filter(d => d.events.phoneUsage).length / data.length,

            // Temporal features
            night_driving_rate: data.filter(d => {
                const hour = new Date(d.timestamp).getHours();
                return hour < 6 || hour > 22;
            }).length / data.length,

            weekend_driving_rate: data.filter(d => {
                const day = new Date(d.timestamp).getDay();
                return day === 0 || day === 6;
            }).length / data.length,

            // Trip features
            total_trips: totalTrips,
            avg_trip_length: data.length / totalTrips,

            // Weather features
            bad_weather_rate: data.filter(d =>
                d.weather && d.weather.roadRisk > 0.5
            ).length / data.length,

            // Data quality
            data_points: data.length,
            time_span_days: Math.ceil((new Date(data[0]?.timestamp) - new Date(data[data.length - 1]?.timestamp)) / (1000 * 60 * 60 * 24))
        };
    }

    calculateVariance(numbers) {
        const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        return squaredDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
    }

    async runMLPrediction(features) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', [
                this.mlModelPath,
                JSON.stringify(features)
            ]);

            let result = '';
            let error = '';

            python.stdout.on('data', (data) => {
                result += data.toString();
            });

            python.stderr.on('data', (data) => {
                error += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const prediction = JSON.parse(result.trim());
                        resolve(prediction);
                    } catch (e) {
                        reject(new Error(`Failed to parse ML prediction: ${e.message}`));
                    }
                } else {
                    console.error('ML prediction error:', error);
                    resolve(null); // Graceful fallback
                }
            });
        });
    }

    analyzeRiskFactors(data) {
        const totalEvents = data.length;

        return {
            speedViolations: {
                count: data.filter(d => d.speed > 70).length,
                rate: data.filter(d => d.speed > 70).length / totalEvents
            },
            harshEvents: {
                count: data.filter(d =>
                    d.events.harshBraking || d.events.harshAcceleration || d.events.harshTurning
                ).length,
                rate: data.filter(d =>
                    d.events.harshBraking || d.events.harshAcceleration || d.events.harshTurning
                ).length / totalEvents
            },
            phoneUsage: {
                count: data.filter(d => d.events.phoneUsage).length,
                rate: data.filter(d => d.events.phoneUsage).length / totalEvents
            },
            nightDriving: {
                count: data.filter(d => {
                    const hour = new Date(d.timestamp).getHours();
                    return hour < 6 || hour > 22;
                }).length,
                rate: data.filter(d => {
                    const hour = new Date(d.timestamp).getHours();
                    return hour < 6 || hour > 22;
                }).length / totalEvents
            }
        };
    }

    summarizeTelemetry(data) {
        if (!data.length) return {};

        const speeds = data.map(d => d.speed);
        const uniqueTrips = new Set(data.map(d => d.tripId)).size;

        return {
            totalTrips: uniqueTrips,
            totalDataPoints: data.length,
            avgSpeed: Math.round(speeds.reduce((sum, s) => sum + s, 0) / speeds.length),
            maxSpeed: Math.round(Math.max(...speeds)),
            totalHarshEvents: data.filter(d =>
                d.events.harshBraking || d.events.harshAcceleration || d.events.harshTurning
            ).length,
            phoneUsageEvents: data.filter(d => d.events.phoneUsage).length,
            timeSpan: `${Math.ceil((new Date(data[0]?.timestamp) - new Date(data[data.length - 1]?.timestamp)) / (1000 * 60 * 60 * 24))} days`
        };
    }
}

module.exports = new IntegratedMLScoring();
