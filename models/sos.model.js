// models/sos.model.js
const mongoose = require("mongoose");

/* -------------------------------------------
   GeoJSON Coordinate Schema
------------------------------------------- */
const geoPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point"
  },
  coordinates: {
    type: [Number], // [lng, lat]
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) &&
               v.length === 2 &&
               typeof v[0] === "number" &&
               typeof v[1] === "number" &&
               v[0] >= -180 &&
               v[0] <= 180 &&
               v[1] >= -90 &&
               v[1] <= 90;
      },
      message: "Invalid GeoJSON Point coordinates"
    }
  }
}, { _id: false });

/* -------------------------------------------
   Attachment Schema (Image / Video)
------------------------------------------- */
const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: v =>
        /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i.test(v),
      message: "Invalid attachment URL"
    }
  },
  type: {
    type: String,
    enum: ["image", "video", "other"],
    default: "image"
  },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

/* -------------------------------------------
   SOS Schema
------------------------------------------- */
const sosSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
      index: true
    },

    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
      index: true
    },

    // raw lat/lng
    location: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 }
    },

    // GeoJSON Point
    locationGeo: {
      type: geoPointSchema,
      default: null
    },

    // required description
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    // required: who press SOS
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    contactPhone: { type: String, default: null },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "high",
      index: true
    },

    status: {
      type: String,
      enum: ["pending", "acknowledged", "resolved", "canceled"],
      default: "pending",
      index: true
    },

    attachments: {
      type: [attachmentSchema],
      default: []
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    handledAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    resolutionNote: {
      type: String,
      default: null,
      maxlength: 1000
    },

    // soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

/* -------------------------------------------
   Indexes
------------------------------------------- */
sosSchema.index({ locationGeo: "2dsphere" });
sosSchema.index({ reportedBy: 1, createdAt: -1 });
sosSchema.index({ rideId: 1, status: 1, createdAt: -1 });

/* -------------------------------------------
   Pre-save: auto-generate GeoJSON + auto timestamps
------------------------------------------- */
sosSchema.pre("save", function(next) {
  // validate lat/lng
  if (!this.location || typeof this.location.lat !== "number" || typeof this.location.lng !== "number") {
    return next(new Error("location.lat and location.lng are required numbers"));
  }

  if (this.location.lat < -90 || this.location.lat > 90 ||
      this.location.lng < -180 || this.location.lng > 180) {
    return next(new Error("Invalid latitude/longitude range"));
  }

  // create GeoJSON
  this.locationGeo = {
    type: "Point",
    coordinates: [this.location.lng, this.location.lat]
  };

  // auto set resolvedAt
  if (this.isModified("status") && this.status === "resolved" && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  // auto set handledAt
  if (this.isModified("handledBy") && this.handledBy && !this.handledAt) {
    this.handledAt = new Date();
  }

  next();
});

module.exports = mongoose.model("SOS", sosSchema);
