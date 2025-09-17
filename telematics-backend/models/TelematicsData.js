const mongoose = require('mongoose');

const telematicsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    timestamp: { type: Date, default: Date.now },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [longitude, latitude]
    },
    speed: { type: Number, required: true },
    acceleration: {
        x: Number,
        y: Number,
        z: Number
    },
    events: {
        harshBraking: { type: Boolean, default: false },
        harshAcceleration: { type: Boolean, default: false },
        harshTurning: { type: Boolean, default: false },
        phoneUsage: { type: Boolean, default: false }
    },
    tripId: String,
    weather: {
        condition: String,
        temperature: Number,
        visibility: Number,
        roadRisk: Number
    },
    roadType: { type: String, enum: ['highway', 'city', 'rural', 'residential', 'parking'] },
    processed: { type: Boolean, default: false }
});

telematicsSchema.index({ location: '2dsphere' });
telematicsSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('TelematicsData', telematicsSchema);
