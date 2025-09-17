const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    policyNumber: { type: String, required: true, unique: true },
    basePremium: { type: Number, required: true },
    currentPremium: { type: Number, required: true },
    coverageType: { type: String, required: true },
    deductible: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    premiumHistory: [{
        date: Date,
        premium: Number,
        riskScore: Number,
        reason: String
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Policy', policySchema);
