const express = require('express');
const TelematicsData = require('../models/TelematicsData');
const weatherService = require('../services/weatherService');

const auth = require('../middleware/auth');
const router = express.Router();

// Submit telematics data
router.post('/data', auth, async (req, res) => {
    try {
        const { vehicleId, location, speed, acceleration, events, weather } = req.body;

        const telematicsData = new TelematicsData({
            userId: req.userId,
            vehicleId,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            },
            speed,
            acceleration,
            events,
            weather: weather || await weatherService.getWeatherByLocation(location.lat, location.lng),
            tripId: req.body.tripId || `trip_${Date.now()}`,
            roadType: req.body.roadType || 'unknown'
        });

        await telematicsData.save();

        res.status(201).json({
            message: 'Telematics data saved successfully',
            dataId: telematicsData._id
        });

    } catch (error) {
        res.status(500).json({ message: 'Error saving telematics data', error: error.message });
    }
});

// Get user's telematics data
router.get('/data', auth, async (req, res) => {
    try {
        const { startDate, endDate, limit = 100 } = req.query;

        let query = { userId: req.userId };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const data = await TelematicsData.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json({
            data,
            count: data.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching telematics data', error: error.message });
    }
});

// Get trip summary
router.get('/trips/:tripId', auth, async (req, res) => {
    try {
        const { tripId } = req.params;

        const tripData = await TelematicsData.find({
            userId: req.userId,
            tripId
        }).sort({ timestamp: 1 });

        if (tripData.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Calculate trip summary
        const startTime = tripData[0].timestamp;
        const endTime = tripData[tripData.length - 1].timestamp;
        const duration = (endTime - startTime) / (1000 * 60); // minutes

        const speeds = tripData.map(d => d.speed);
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

        const harshEvents = {
            braking: tripData.filter(d => d.events.harshBraking).length,
            acceleration: tripData.filter(d => d.events.harshAcceleration).length,
            turning: tripData.filter(d => d.events.harshTurning).length,
            phoneUsage: tripData.filter(d => d.events.phoneUsage).length
        };

        // Estimate distance
        let distance = 0;
        for (let i = 1; i < tripData.length; i++) {
            const timeDiff = (tripData[i].timestamp - tripData[i - 1].timestamp) / (1000 * 60 * 60); // hours
            const avgSpeed = (tripData[i].speed + tripData[i - 1].speed) / 2;
            distance += avgSpeed * timeDiff;
        }

        const summary = {
            tripId,
            startTime,
            endTime,
            duration: Math.round(duration),
            distance: Math.round(distance * 10) / 10,
            maxSpeed: Math.round(maxSpeed),
            avgSpeed: Math.round(avgSpeed),
            harshEvents,
            dataPoints: tripData.length,
            route: tripData.map(d => ({
                timestamp: d.timestamp,
                coordinates: d.location.coordinates,
                speed: d.speed
            }))
        };

        res.json({ summary });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching trip data', error: error.message });
    }
});

// In routes/telematics.js
router.get('/trips', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Get unique trips with details
        const trips = await TelematicsData.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            {
                $group: {
                    _id: '$tripId',
                    startTime: { $min: '$timestamp' },
                    endTime: { $max: '$timestamp' },
                    dataPoints: { $sum: 1 },
                    avgSpeed: { $avg: '$speed' },
                    maxSpeed: { $max: '$speed' },
                    harshEvents: {
                        $sum: {
                            $cond: [
                                { $or: ['$events.harshBraking', '$events.harshAcceleration', '$events.harshTurning'] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            { $sort: { startTime: -1 } },
            { $limit: limit }
        ]);

        // Add estimated distance
        const processedTrips = trips.map(trip => {
            const duration = (new Date(trip.endTime) - new Date(trip.startTime)) / (1000 * 60); // minutes
            const estimatedDistance = Math.round((trip.avgSpeed * duration / 60) * 10) / 10; // miles, 1 decimal

            return {
                tripId: trip._id,
                startTime: trip.startTime,
                endTime: trip.endTime,
                duration: Math.round(duration),
                distance: estimatedDistance,
                avgSpeed: Math.round(trip.avgSpeed),
                maxSpeed: Math.round(trip.maxSpeed),
                harshEvents: trip.harshEvents,
                dataPoints: trip.dataPoints
            };
        });

        res.json({
            success: true,
            trips: processedTrips,
            count: processedTrips.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trips',
            error: error.message
        });
    }
});


// Get driving statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const data = await TelematicsData.find({
            userId: req.userId,
            timestamp: { $gte: startDate, $lte: endDate }
        });

        if (data.length === 0) {
            return res.json({
                message: 'No data available for the specified period',
                stats: null
            });
        }

        // Calculate statistics
        const speeds = data.map(d => d.speed);
        const totalTrips = [...new Set(data.map(d => d.tripId))].length;
        const totalHarshEvents = data.reduce((sum, d) =>
            sum + (d.events.harshBraking ? 1 : 0) +
            (d.events.harshAcceleration ? 1 : 0) +
            (d.events.harshTurning ? 1 : 0), 0);

        const stats = {
            period: `${days} days`,
            totalDataPoints: data.length,
            totalTrips,
            avgSpeed: Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length),
            maxSpeed: Math.max(...speeds),
            totalHarshEvents,
            harshEventsPerTrip: totalTrips > 0 ? Math.round((totalHarshEvents / totalTrips) * 10) / 10 : 0,
            phoneUsageEvents: data.filter(d => d.events.phoneUsage).length,
            nightDrivingPercentage: Math.round((data.filter(d => {
                const hour = new Date(d.timestamp).getHours();
                return hour >= 22 || hour <= 5;
            }).length / data.length) * 100)
        };

        res.json({ stats });

    } catch (error) {
        res.status(500).json({ message: 'Error calculating statistics', error: error.message });
    }
});

module.exports = router;
