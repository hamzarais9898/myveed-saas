/**
 * Admin Middleware
 * Protects admin routes - ensures user is authenticated and has admin role
 */

const isAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required. This action is restricted to administrators only.' 
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization' 
    });
  }
};

module.exports = { isAdmin };
