const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testDeleteWithAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get an admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log(`\nTesting with admin user: ${adminUser.username} (${adminUser.email})`);
    console.log(`Role: ${adminUser.role}`);

    // Generate a token for this admin user
    const token = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    console.log(`\nGenerated token: ${token.substring(0, 50)}...`);

    // Decode the token to verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Decoded token userId: ${decoded.userId}`);

    // Fetch user from database (like the auth middleware does)
    const fetchedUser = await User.findById(decoded.userId).select('-password');
    console.log(`Fetched user role: ${fetchedUser.role}`);
    console.log(`Is admin: ${fetchedUser.role === 'admin'}`);

    // Test the delete logic
    const isAdmin = fetchedUser.role === 'admin';
    console.log(`\nDelete permission check:`);
    console.log(`- User role: ${fetchedUser.role}`);
    console.log(`- Is admin: ${isAdmin}`);
    console.log(`- Can delete: ${isAdmin ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDeleteWithAuth();
