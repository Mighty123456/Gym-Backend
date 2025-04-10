const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateImageUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    // Update each user's photo URL if it contains the old domain
    let updatedCount = 0;
    for (const user of users) {
      if (user.photo && user.photo.includes('gym-backend-mz5w.onrender.com')) {
        const newUrl = user.photo.replace(
          'https://gym-backend-mz5w.onrender.com',
          'https://gym-backend-hz0n.onrender.com'
        );
        user.photo = newUrl;
        await user.save();
        updatedCount++;
        console.log(`Updated user ${user._id}: ${newUrl}`);
      }
    }

    console.log(`Updated ${updatedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateImageUrls(); 