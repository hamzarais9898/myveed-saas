const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { sendVerificationEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate 6-digit random code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Check for duplicate accounts by IP or Device ID
 */
const checkDuplicateUser = async (ip, deviceId) => {
  if (!ip && !deviceId) return false;
  
  const query = {
    $or: []
  };

  if (ip) query.$or.push({ ipAddress: ip });
  if (deviceId) query.$or.push({ deviceId: deviceId });

  if (query.$or.length === 0) return false;

  const existingUser = await User.findOne(query);
  return !!existingUser;
};

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Verification Code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user (unverified)
    const user = await User.create({
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationExpires,
      ipAddress,
      deviceId
    });

    // Send Verification Email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
        // We could delete the user here if we want strict enforcement, 
        // but it's better to allow resend later
    }

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      requiresVerification: true,
      email: user.email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Verify Email Code
 * POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code, deviceId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check code and expiration
    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (user.verificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Update IP/Device if not set during register (e.g. legacy/error)
    if (!user.ipAddress) user.ipAddress = ipAddress;
    if (!user.deviceId && deviceId) user.deviceId = deviceId;

    // CHECK FOR DUPLICATES
    const isDuplicate = await checkDuplicateUser(user.ipAddress, user.deviceId);
    
    // Activate user
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    await user.save();

    // CREATE SUBSCRIPTION IMMEDIATELY
    const Subscription = require('../models/Subscription');
    const existingSub = await Subscription.findOne({ userId: user._id });
    
    if (!existingSub) {
      await Subscription.create({
        userId: user._id,
        plan: 'free',
        credits: isDuplicate ? 0 : 30, // 0 credits if duplicate
        ttsCredits: isDuplicate ? 0 : 10
      });
      
      if (isDuplicate) {
        console.log(`⚠️ Fraud prevention: User ${user.email} flagged as duplicate. 0 credits assigned.`);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

/**
 * Resend Verification Code
 * POST /api/auth/resend-code
 */
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'New verification code sent'
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resending code'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if verified
    if (!user.isVerified && user.password && !user.googleId) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email first',
          requiresVerification: true,
          email: user.email
        });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update login IP/Device for tracking
    if (ipAddress) user.ipAddress = ipAddress;
    if (deviceId) user.deviceId = deviceId;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        city: user.city,
        country: user.country,
        phone: user.phone,
        role: user.role,
        hasInstagram: !!user.instagramAccessToken,
        hasTikTok: !!user.tiktokAccessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Google OAuth Login
 * POST /api/auth/google
 */
exports.googleLogin = async (req, res) => {
  try {
    const { credential, accessToken, deviceId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!credential && !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google credential or access token is required'
      });
    }

    let email, googleId, name, picture;

    if (credential) {
        // Verify Google ID Token
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        googleId = payload.sub;
        name = payload.name;
        picture = payload.picture;
    } else if (accessToken) {
        // Verify Google Access Token via UserInfo API
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info from Google');
        }

        const payload = await userInfoResponse.json();
        email = payload.email;
        googleId = payload.sub;
        name = payload.name;
        picture = payload.picture;
    }

    // Check if user exists
    let user = await User.findOne({ email });

    // Enforce exclusive admin and unlimited tokens for specific email
    const isAdminEmail = email === 'othman.mekouar99@gmail.com';
    const targetRole = isAdminEmail ? 'admin' : 'user';

    const Subscription = require('../models/Subscription');
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Check for duplicates before creating
      const isDuplicate = await checkDuplicateUser(ipAddress, deviceId);

      // Create new user with Google account (Google users are auto-verified)
      user = await User.create({
        email,
        password: await bcrypt.hash(googleId, 10), // Use Google ID as password hash
        googleId,
        name,
        picture,
        role: targetRole,
        isVerified: true,
        ipAddress,
        deviceId
      });

      // Create Subscription Immediately
       await Subscription.create({
          userId: user._id,
          plan: 'free',
          credits: isDuplicate ? 0 : 30,
          ttsCredits: isDuplicate ? 0 : 10
        });

      if (isDuplicate) {
          console.log(`⚠️ Fraud prevention: Google User ${user.email} flagged as duplicate. 0 credits assigned.`);
      }

    } else {
      // Update role (demote others, promote admin)
      user.role = targetRole;
      user.googleId = googleId;
      user.name = name;
      user.picture = picture;
      user.isVerified = true; // Google users are verified
      // Update tracking
      if (ipAddress) user.ipAddress = ipAddress;
      if (deviceId) user.deviceId = deviceId;
      await user.save();
    }

    // Ensure professional plan for admin
    if (isAdminEmail) {
      let subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription) {
        await Subscription.create({
          userId: user._id,
          plan: 'professional',
          credits: -1,
          ttsCredits: -1,
          status: 'active'
        });
      } else if (subscription.plan !== 'professional') {
        subscription.plan = 'professional';
        subscription.credits = -1;
        subscription.ttsCredits = -1;
        subscription.status = 'active';
        await subscription.save();
      }
    } else if (!isNewUser) {
        // Ensure subscription exists for returning users
        let subscription = await Subscription.findOne({ userId: user._id });
        if (!subscription) {
             await Subscription.create({
                userId: user._id,
                plan: 'free',
                credits: 30, // Assuming old user valid
                ttsCredits: 10
            });
        }
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        city: user.city,
        country: user.country,
        phone: user.phone,
        role: user.role,
        hasInstagram: !!user.instagramAccessToken,
        hasTikTok: !!user.tiktokAccessToken
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to authenticate with Google',
      error: error.message
    });
  }
};

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware
    const { name, city, country, phone } = req.body;
    
    let updates = {};
    if (name) updates.name = name;
    if (city) updates.city = city;
    if (country) updates.country = country;
    if (phone) updates.phone = phone;
    
    // If file uploaded via Cloudinary
    if (req.file) {
      updates.picture = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        city: user.city,
        country: user.country,
        phone: user.phone,
        role: user.role,
        hasInstagram: !!user.instagramAccessToken,
        hasTikTok: !!user.tiktokAccessToken
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};
