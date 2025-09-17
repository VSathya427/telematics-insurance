const TelematicsData = require('../models/TelematicsData');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const weatherService = require('./weatherService');

class TelematicsSimulator {
    constructor() {
        this.activeTrips = new Map();
        this.userVehicles = new Map(); // Cache user vehicles
        this.isRunning = false;
    }

    async startSimulation(io) {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('Starting telematics simulation...');

        // Pre-populate user vehicles cache
        await this.preloadUserVehicles();

        setInterval(async () => {
            const users = await User.find({ isActive: true }).select('_id');

            for (const user of users) {
                await this.generateTelematicsData(user._id, io);
            }
        }, 10000); // Generate data every 10 seconds
    }

    async preloadUserVehicles() {
        try {
            const users = await User.find({ isActive: true });

            for (const user of users) {
                // Check if user has a vehicle
                let vehicle = await Vehicle.findOne({ userId: user._id });

                if (!vehicle) {
                    // Create a default vehicle for the user
                    vehicle = await this.createDefaultVehicle(user._id);
                }

                this.userVehicles.set(user._id.toString(), vehicle._id);
            }

            console.log(`✅ Preloaded vehicles for ${this.userVehicles.size} users`);
        } catch (error) {
            console.error('Error preloading user vehicles:', error);
        }
    }

    async createDefaultVehicle(userId) {
        const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan'];
        const models = ['Camry', 'Civic', 'F-150', 'Malibu', 'Altima'];
        const colors = ['White', 'Black', 'Silver', 'Blue', 'Red'];

        const randomMake = makes[Math.floor(Math.random() * makes.length)];
        const randomModel = models[Math.floor(Math.random() * models.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomYear = 2015 + Math.floor(Math.random() * 9); // 2015-2023

        const vehicle = new Vehicle({
            userId,
            vin: 'SIM' + Math.random().toString(36).substr(2, 14).toUpperCase(),
            make: randomMake,
            model: randomModel,
            year: randomYear,
            color: randomColor,
            mileage: Math.floor(Math.random() * 100000),
            safetyRating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
            isActive: true
        });

        await vehicle.save();
        console.log(`Created default vehicle for user ${userId}: ${randomYear} ${randomMake} ${randomModel}`);
        return vehicle;
    }

    async generateTelematicsData(userId, io) {
        try {
            // Get or create vehicle for this user
            let vehicleId = this.userVehicles.get(userId.toString());

            if (!vehicleId) {
                const vehicle = await this.createDefaultVehicle(userId);
                vehicleId = vehicle._id;
                this.userVehicles.set(userId.toString(), vehicleId);
            }

            const baseLocation = { lat: 40.7128, lng: -74.0060 }; // NYC
            const currentTrip = this.activeTrips.get(userId.toString()) || this.createNewTrip(baseLocation, vehicleId);

            // Simulate movement
            currentTrip.location.lat += (Math.random() - 0.5) * 0.001;
            currentTrip.location.lng += (Math.random() - 0.5) * 0.001;

            // Simulate speed (0-80 mph)
            const speed = Math.max(0, currentTrip.speed + (Math.random() - 0.5) * 10);
            currentTrip.speed = Math.min(80, speed);

            // Detect harsh events
            const events = this.detectHarshEvents(currentTrip.speed, currentTrip.previousSpeed);

            // Get weather data (with fallback to avoid API failures)
            let weather;
            try {
                weather = await weatherService.getWeatherByLocation(
                    currentTrip.location.lat,
                    currentTrip.location.lng
                );
            } catch (error) {
                // Fallback weather data
                weather = {
                    condition: 'clear',
                    temperature: 72,
                    visibility: 10,
                    roadRisk: 0.1
                };
            }

            const telematicsData = new TelematicsData({
                userId,
                vehicleId: vehicleId, // Now properly set
                timestamp: new Date(),
                location: {
                    type: 'Point',
                    coordinates: [currentTrip.location.lng, currentTrip.location.lat]
                },
                speed: currentTrip.speed,
                acceleration: {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2,
                    z: 9.8 + (Math.random() - 0.5) * 0.5
                },
                events,
                tripId: currentTrip.id,
                weather,
                roadType: this.determineRoadType(currentTrip.speed),
                processed: false
            });

            await telematicsData.save();

            // Emit real-time data
            io.to(`user-${userId}`).emit('telematicsUpdate', telematicsData);

            currentTrip.previousSpeed = currentTrip.speed;
            this.activeTrips.set(userId.toString(), currentTrip);

        } catch (error) {
            console.error('Error generating telematics data:', error.message);
            // Don't spam the console with full stack traces
        }
    }

    createNewTrip(baseLocation, vehicleId) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            location: { ...baseLocation },
            speed: Math.random() * 30 + 20, // 20-50 mph initial
            previousSpeed: 0,
            vehicleId: vehicleId, // Properly set vehicleId
            startTime: new Date()
        };
    }

    detectHarshEvents(currentSpeed, previousSpeed) {
        const acceleration = currentSpeed - previousSpeed;

        return {
            harshBraking: acceleration < -15,
            harshAcceleration: acceleration > 15,
            harshTurning: Math.random() < 0.02, // 2% chance
            phoneUsage: Math.random() < 0.05 // 5% chance
        };
    }

    determineRoadType(speed) {
        if (speed > 55) return 'highway';
        if (speed > 35) return 'city';
        if (speed > 20) return 'residential';
        return 'rural';
    }
}

module.exports = new TelematicsSimulator();
