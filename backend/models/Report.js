const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Report Identification
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  trackingCode: {
    type: String,
    default: function() {
      const crypto = require('crypto');
      const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
      const timePart = Date.now().toString(36).toUpperCase();
      return `TRK-${timePart}-${randomPart}`;
    }
  },
  
  // Report Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'in_progress', 'resolved', 'closed'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  mlAnalysis: {
    detected: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    recommendation: { type: String, default: null },
    numDetections: { type: Number, default: 0 },
    totalArea: { type: Number, default: 0 },
    analyzedAt: { type: Date, default: null }
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Reporter Information
  reporter: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
  },
  
  // Issue Details
  issue: {
    category: {
      type: String,
      required: true
    },
    subcategory: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    inputMode: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text'
    },
    hasVoiceRecording: {
      type: Boolean,
      default: false
    },
    photos: [{
      uri: {
        type: String,
        required: true
      },
      filename: {
        type: String,
        default: null
      },
      size: {
        type: Number,
        default: null
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    priority: {
      type: String,
      default: null
    },
    severity: {
      type: String,
      default: null
    },
    mlAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  
  // Location Information
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: null
    },
    accuracy: {
      type: Number,
      default: null
    }
  },
  
  // Assignment Details
  assignment: {
    department: {
      type: String,
      default: null
    },
    assignedTo: {
      type: String,
      default: null
    },
    assignedPerson: {
      type: String,
      default: null
    },
    contactEmail: {
      type: String,
      default: null
    },
    contactPhone: {
      type: String,
      default: null
    },
    estimatedResolution: {
      type: String,
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    }
  },
  
  // Additional Fields
  notes: [{
    note: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Social interactions
  likes: [{ type: String, lowercase: true }], // store user emails or IDs
  dislikes: [{ type: String, lowercase: true }],
  comments: [{
    byEmail: { type: String, lowercase: true },
    byName: String,
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Resolution Details
  resolution: {
    description: {
      type: String,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: String,
      default: null
    },
    resolutionPhotos: [{
      uri: String,
      filename: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
reportSchema.index({ reportId: 1 });
reportSchema.index({ 'reporter.email': 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ submittedAt: -1 });
reportSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
// Ensure trackingCode is not unique or is sparse if it could be null in legacy data
// If a unique index exists on trackingCode in the DB, it should be dropped or recreated as sparse/partial.

// Virtual for coordinates string
reportSchema.virtual('coordinates').get(function() {
  return `${this.location.latitude}, ${this.location.longitude}`;
});

// Pre-save middleware to update updatedAt
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to generate report ID
reportSchema.statics.generateReportId = function() {
  // Use crypto for strong randomness and include a short time component to reduce collision risk further
  const crypto = require('crypto');
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase();
  return `RPT-${timePart}-${randomPart}`;
};

module.exports = mongoose.model('Report', reportSchema);
