const Newsletter = require('../models/Newsletter');
const emailService = require('../services/emailService');

/**
 * Newsletter Controller
 * Handles newsletter subscriptions and management
 */

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.status === 'active') {
        return res.status(200).json({
          success: true,
          message: 'Already subscribed'
        });
      } else {
        // Re-activate
        existing.status = 'active';
        existing.subscribedAt = Date.now();
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Subscription reactivated'
        });
      }
    }

    // Create new subscription
    await Newsletter.create({ email });

    // Send welcome email (asynchronous to not block response)
    emailService.sendNewsletterWelcomeEmail(email).catch(err => 
      console.error('Async welcome email error:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription'
    });
  }
};

// Get all subscribers (Admin only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
    res.json({
      success: true,
      subscribers
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving subscribers'
    });
  }
};

// Unsubscribe
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const subscriber = await Newsletter.findOne({ email });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    subscriber.status = 'unsubscribed';
    await subscriber.save();

    res.json({
      success: true,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during unsubscription'
    });
  }
};

// Send Bulk Email (Admin only)
exports.sendBulkEmail = async (req, res) => {
  try {
    const { emails, subject, content } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient emails are required'
      });
    }

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    const success = await emailService.sendBulkNewsletterEmail(emails, subject, content);

    if (success) {
      res.json({
        success: true,
        message: `Email successfully sent to ${emails.length} subscribers`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk email'
      });
    }
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk mailing'
    });
  }
};
