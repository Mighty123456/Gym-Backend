const User = require('../models/User');
const { sendEmail } = require('./emailService');

const checkExpiredSubscriptions = async () => {
  try {
    const today = new Date();
    
    // Find users whose subscriptions have expired
    const expiredUsers = await User.find({
      endDate: { $lt: today },
      subscriptionStatus: { $ne: 'expired' }
    });

    // Update their status and send notifications
    for (const user of expiredUsers) {
      user.subscriptionStatus = 'expired';
      await user.save();

      // Send notification email
      await sendEmail({
        email: user.email,
        subject: 'StarGym Membership Expired',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Your StarGym Membership Has Expired</h1>
            <p>Dear ${user.name},</p>
            <p>Your membership plan has expired on ${new Date(user.endDate).toLocaleDateString()}.</p>
            <p>To continue enjoying our services, please renew your membership.</p>
            <p>Thank you for choosing StarGym!</p>
          </div>
        `
      });
    }

    // Find users whose subscriptions are about to expire
    const nearingExpiry = await User.find({
      endDate: {
        $gt: today,
        $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      subscriptionStatus: 'active'
    });

    // Send reminder emails
    for (const user of nearingExpiry) {
      const daysLeft = Math.ceil((new Date(user.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      await sendEmail({
        email: user.email,
        subject: 'StarGym Membership Expiring Soon',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Your StarGym Membership is Expiring Soon</h1>
            <p>Dear ${user.name},</p>
            <p>Your membership plan will expire in ${daysLeft} days on ${new Date(user.endDate).toLocaleDateString()}.</p>
            <p>To avoid any interruption in services, please renew your membership before it expires.</p>
            <p>Thank you for choosing StarGym!</p>
          </div>
        `
      });
    }
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  }
};

module.exports = { checkExpiredSubscriptions }; 