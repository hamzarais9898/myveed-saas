const ContactMessage = require('../models/ContactMessage');
const emailService = require('../services/emailService');

// Submit a new contact message
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user ? req.user.id : null; // capture user ID if authenticated

    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, subject, and message.'
      });
    }

    // 1. Save to Database
    const newMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      user: userId,
      status: 'new'
    });

    // 2. Send Email Notification to Admin & Confirmation to Client (Async)
    emailService.sendContactEmail({ name, email, subject, message })
      .catch(err => console.error('Failed to send admin email notification:', err));
      
    emailService.sendContactConfirmationToClient(email, name)
      .catch(err => console.error('Failed to send client confirmation email:', err));

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: newMessage
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get all messages (Admin only)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message
    });
  }
};

// Update message status (e.g., mark as read)
exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated',
      data: message
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};
