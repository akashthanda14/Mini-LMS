// middleware/rbacMiddleware.js
// Role-Based Access Control (RBAC) middleware

/**
 * Require LEARNER role (allows LEARNER, CREATOR, ADMIN)
 * All authenticated users can access
 */
export const requireLearner = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const validRoles = ['LEARNER', 'CREATOR', 'ADMIN'];
    
    if (!validRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  } catch (error) {
    console.error('RBAC Learner middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error.',
    });
  }
};

/**
 * Require CREATOR role (allows only CREATOR, ADMIN)
 * For course creation and management
 */
export const requireCreator = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const validRoles = ['CREATOR', 'ADMIN'];
    
    if (!validRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Creator role required.',
      });
    }

    next();
  } catch (error) {
    console.error('RBAC Creator middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error.',
    });
  }
};

/**
 * Require ADMIN role (allows only ADMIN)
 * For platform administration
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    next();
  } catch (error) {
    console.error('RBAC Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error.',
    });
  }
};

/**
 * Check if user has any of the specified roles
 * @param {Array<string>} roles - Array of allowed roles
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      console.error('RBAC Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error.',
      });
    }
  };
};

export default {
  requireLearner,
  requireCreator,
  requireAdmin,
  requireRole,
};
