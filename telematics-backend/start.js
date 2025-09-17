const mongoose = require('mongoose');
require('dotenv').config();

async function quickStart() {
    try {
        // Test database connection
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connected');

        // Create test user
        const User = require('./models/User');
        const testUser = await User.create({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            dateOfBirth: new Date('1990-01-01'),
            licenseNumber: 'TEST123456',
            address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345'
            }
        });

        console.log('✅ Test user created:', er.email);
        console.log('🚀 Ready to start server!');

    } catch (error) {
        if (error.code === 11000) {
            console.log('✅ Test user already exists');
        } else {
            console.error('❌ Setup error:', error.message);
        }
    }
}

quickStart();
