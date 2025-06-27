const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  adminId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String
  },
  designation: {
    type: String,
    required: true
  },
  permissions: {
    type: [String],
    default: ['VIEW_DASHBOARD'],
    validate: {
      validator: function(permissions) {
        const validPermissions = [
          'VIEW_DASHBOARD',
          'MANAGE_STUDENTS',
          'MANAGE_TEACHERS',
          'MANAGE_ADMINS',
          'MANAGE_NOTICES',
          'VIEW_ANALYTICS',
          'MANAGE_SUBJECTS',
          'MANAGE_ATTENDANCE',
          'SYSTEM_SETTINGS'
        ];
        return permissions.every(permission => validPermissions.includes(permission));
      },
      message: 'Invalid permission(s) specified'
    }
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Method to check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
  return this.isSuperAdmin || this.permissions.includes(permission);
};

// Method to check if admin has all specified permissions
adminSchema.methods.hasPermissions = function(requiredPermissions) {
  return this.isSuperAdmin || requiredPermissions.every(permission => 
    this.permissions.includes(permission)
  );
};

// Index for faster queries
adminSchema.index({ department: 1 });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;