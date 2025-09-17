const mongoose = require('mongoose');

require('dotenv').config();

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const TelematicsData = require('../models/TelematicsData');

class BetterMockDataGenerator {
    constructor() {
        this.startDate = new Date();
        this.startDate.setMonth(this.startDate.getMonth() - 6); // 6 months ago
        this.endDate = new Date();
    }

    async connectDB() {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telematics_insurance');
        console.log('✅ Connected to MongoDB');
    }

    async cleanupExistingData() {
        try {
            await User.deleteOne({ email: 'demo.driver@telematicsinsure.com' });
            await Vehicle.deleteMany({ vin: '1DEMO123456789012' });

            const demoUsers = await User.find({ email: /demo\.driver/ });
            const userIds = demoUsers.map(u => u._id);
            await TelematicsData.deleteMany({ userId: { $in: userIds } });

            console.log('🧹 Cleaned up existing demo data');
        } catch (error) {
            console.error('⚠️  Cleanup error (non-critical):', error.message);
        }
    }

    async createMockUser() {
        const mockUser = new User({
            email: 'demo.driver@telematicsinsure.com',
            password: 'password123',
            firstName: 'Sarah',
            lastName: 'Johnson',
            dateOfBirth: new Date('1985-03-15'),
            licenseNumber: 'DL789456123',
            address: {
                street: '123 Demo Street',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102'
            },
            riskScore: 35,
            isActive: true
        });

        await mockUser.save();
        console.log('✅ Created demo user:', mockUser.email);
        return mockUser;
    }

    async createMockVehicle(userId) {
        const mockVehicle = new Vehicle({
            userId: userId,
            vin: '1DEMO123456789012',
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            color: 'Silver',
            mileage: 35000,
            safetyRating: 5,
            isActive: true
        });

        await mockVehicle.save();
        console.log('✅ Created demo vehicle:', `${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}`);
        return mockVehicle;
    }

    generateRealisticDailyTrips(date) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let tripPatterns = [];

        if (isWeekend) {
            // Weekend: 0-3 trips, more leisure-based
            const numTrips = Math.floor(Math.random() * 4); // 0-3 trips
            const tripTimes = [
                { hour: 10, type: 'leisure' },
                { hour: 14, type: 'shopping' },
                { hour: 19, type: 'dinner' }
            ].slice(0, numTrips);

            tripPatterns = tripTimes;
        } else {
            // Weekday: Usually 2-4 trips
            const hasCommute = Math.random() > 0.1; // 90% chance of commute
            const hasLunchTrip = Math.random() > 0.6; // 40% chance of lunch trip
            const hasEveningTrip = Math.random() > 0.7; // 30% chance of evening trip

            if (hasCommute) {
                tripPatterns.push({ hour: 7 + Math.random() * 2, type: 'morning_commute' });
                tripPatterns.push({ hour: 17 + Math.random() * 2, type: 'evening_commute' });
            }

            if (hasLunchTrip) {
                tripPatterns.push({ hour: 12 + Math.random() * 1, type: 'lunch' });
            }

            if (hasEveningTrip) {
                tripPatterns.push({ hour: 19 + Math.random() * 3, type: 'evening' });
            }
        }

        return tripPatterns;
    }

    generateTripData(baseDate, tripInfo, tripIndex) {
        const startTime = new Date(baseDate);
        startTime.setHours(Math.floor(tripInfo.hour));
        startTime.setMinutes((tripInfo.hour % 1) * 60 + Math.random() * 30);

        // Trip duration based on type
        let duration;
        switch (tripInfo.type) {
            case 'morning_commute':
            case 'evening_commute':
                duration = 25 + Math.random() * 20; // 25-45 minutes
                break;
            case 'lunch':
                duration = 15 + Math.random() * 15; // 15-30 minutes
                break;
            case 'shopping':
                duration = 30 + Math.random() * 30; // 30-60 minutes
                break;
            default:
                duration = 20 + Math.random() * 25; // 20-45 minutes
        }

        const dataPointsPerTrip = Math.max(5, Math.floor(duration / 2)); // At least 5 points, every 2 minutes
        const tripData = [];

        // Starting location (SF Bay Area)
        let currentLat = 37.7749 + (Math.random() - 0.5) * 0.05;
        let currentLng = -122.4194 + (Math.random() - 0.5) * 0.05;

        const hour = startTime.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        const isNight = hour < 6 || hour > 22;
        const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;

        for (let i = 0; i < dataPointsPerTrip; i++) {
            const pointTime = new Date(startTime.getTime() + (i * 2 * 60 * 1000));

            // Realistic speed based on conditions
            let baseSpeed = 35;
            if (isRushHour && !isWeekend) baseSpeed = 20; // Rush hour traffic
            if (tripInfo.type === 'morning_commute' || tripInfo.type === 'evening_commute') {
                baseSpeed = isRushHour ? 15 : 45; // Heavy traffic during commute
            }
            if (isNight) baseSpeed = 45; // Night driving
            if (isWeekend) baseSpeed = 40; // Weekend driving

            const speed = Math.max(0, baseSpeed + (Math.random() - 0.5) * 20);

            // Movement simulation
            currentLat += (Math.random() - 0.5) * 0.001;
            currentLng += (Math.random() - 0.5) * 0.001;

            // Events with realistic probabilities
            const harshBraking = Math.random() < (isRushHour ? 0.03 : 0.01);
            const harshAcceleration = Math.random() < (isRushHour ? 0.025 : 0.008);
            const harshTurning = Math.random() < 0.005;
            const phoneUsage = Math.random() < (isNight ? 0.002 : tripInfo.type === 'leisure' ? 0.015 : 0.008);

            tripData.push({
                timestamp: pointTime,
                location: {
                    type: 'Point',
                    coordinates: [currentLng, currentLat]
                },
                speed: Math.round(speed * 10) / 10,
                acceleration: (Math.random() - 0.5) * 1.5,
                braking: harshBraking,
                events: {
                    harshBraking,
                    harshAcceleration,
                    harshTurning,
                    phoneUsage
                },
                tripId: `trip_${baseDate.toISOString().split('T')[0]}_${tripIndex}`,
                // Remove roadType to avoid validation errors
                processed: true
            });
        }

        return tripData;
    }

    async generateFullDataset(userId, vehicleId) {
        console.log('🚀 Generating 6 months of realistic telemetry data...');

        const totalDays = Math.floor((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
        let totalDataPoints = 0;
        let totalTrips = 0;

        for (let day = 0; day < totalDays; day++) {
            const currentDate = new Date(this.startDate.getTime() + (day * 24 * 60 * 60 * 1000));

            // Generate realistic daily trip patterns
            const dailyTrips = this.generateRealisticDailyTrips(currentDate);
            totalTrips += dailyTrips.length;

            let dayData = [];

            dailyTrips.forEach((tripInfo, index) => {
                const tripData = this.generateTripData(currentDate, tripInfo, index + 1);
                dayData = dayData.concat(tripData);
            });

            // Add user and vehicle IDs to all data points
            const processedDayData = dayData.map(point => ({
                userId,
                vehicleId,
                ...point
            }));

            // Batch insert for performance
            if (processedDayData.length > 0) {
                try {
                    await TelematicsData.insertMany(processedDayData);
                    totalDataPoints += processedDayData.length;
                } catch (error) {
                    console.error(`Error inserting data for day ${day}:`, error.message);
                }
            }

            // Progress indicator every 30 days
            if (day % 30 === 0 && day > 0) {
                console.log(`📅 Generated ${day} days (${totalDataPoints} data points, ${totalTrips} trips so far)`);
            }
        }

        console.log(`✅ Generated ${totalDataPoints} data points across ${totalTrips} trips over ${totalDays} days`);
        return { totalDataPoints, totalTrips };
    }

    async generate() {
        try {
            console.log('🎯 Starting better mock data generation...');

            await this.connectDB();
            await this.cleanupExistingData();

            // Create mock user and vehicle
            const mockUser = await this.createMockUser();
            const mockVehicle = await this.createMockVehicle(mockUser._id);

            // Generate comprehensive dataset
            const { totalDataPoints, totalTrips } = await this.generateFullDataset(mockUser._id, mockVehicle._id);

            console.log('\n🎉 Better mock data generation completed successfully!');
            console.log(`📊 Total data points: ${totalDataPoints.toLocaleString()}`);
            console.log(`🚗 Total trips: ${totalTrips.toLocaleString()}`);
            console.log(`📈 Average data points per trip: ${Math.round(totalDataPoints / totalTrips)}`);
            console.log(`👤 Demo user email: ${mockUser.email}`);
            console.log(`🔑 Demo password: password123`);
            console.log(`🚗 Vehicle: ${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}`);
            console.log('\n💡 Dashboard should now show realistic trip distribution and metrics!');

        } catch (error) {
            console.error('❌ Better mock data generation failed:', error);
            process.exit(1);
        } finally {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const generator = new BetterMockDataGenerator();
    generator.generate().then(() => {
        console.log('✨ Script completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = BetterMockDataGenerator;
