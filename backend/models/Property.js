const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    // Basic Info
    propertyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ['BUY', 'RENT', 'COMMERCIAL'],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    subcategory: {
      type: String,
      required: false,
    },

    // Location
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: false,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      landmark: String,
      locality: String,
    },

    // Contact
    contact: {
      name: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
      phone: {
        type: String,
        required: true,
      },
    },

    // Property Details (Common)
    price: {
      type: Number,
      required: false,
      default: null,
    },
    area: {
      type: Number,
      required: true,
    },
    areaUnit: {
      type: String,
      enum: ['sq_ft', 'sq_m', 'acres'],
      default: 'sq_ft',
    },
    bedrooms: {
      type: Number,
      default: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
    },
    bathroom2: {
      type: Number,
      default: 0,
    },

    // Images and Media
    images: [
      {
        type: String,
      },
    ],

    // Amenities & Facilities
    amenities: [
      {
        type: String,
      },
    ],
    facilities: [
      {
        type: String,
      },
    ],
    furnishingItems: [
      {
        type: String,
      },
    ],
    outdoorFeatures: [
      {
        type: String,
      },
    ],

    // Resale Info (for BUY properties)
    resaleInfo: {
      approval: String,
      reraNumber: String,
      expectedPrice: Number,
      pricePerSqft: Number,
      maintenanceCharges: Number,
      bookingAmount: Number,
      floorNumber: Number,
      totalFloors: Number,
      propertyAge: Number,
      ownershipType: String,
      furnishingStatus: String,
      balcony: String,
      readyToMove: Boolean,
      possessionStatus: String,
      availableFrom: String,
    },

    // Rental Info (for RENT properties)
    rentalInfo: {
      furnishingStatus: String,
      monthlyRent: Number,
      securityDeposit: Number,
      maintenanceCharges: Number,
      availableFrom: String,
      preferredTenant: String,
      separateEntrance: Boolean,
      waterSupply: Boolean,
      petFriendly: Boolean,
    },

    // Commercial Details (for COMMERCIAL properties)
    commercialDetails: {
      builtUpArea: Number,
      carpetArea: Number,
      ceilingHeight: Number,
      frontageWidth: Number,
      propertyStatus: String,
      ownershipType: String,
      propertyAge: Number,
      floorNumber: Number,
      totalFloors: Number,
      facing: String,
      furnishingType: String,
      suitableFor: [String],
      propertyDocumentsClear: Boolean,
      loanApproved: Boolean,
      occupancyCertificate: Boolean,
      tradeLicense: Boolean,
      commercialApproval: Boolean,
      businessAdvantages: String,
      footfallDetails: String,
      investmentOpportunity: String,
      rentalIncomePotential: String,
      primeLocationBenefits: String,
      leaseDuration: String,
      lockInPeriod: String,
      rentEscalation: String,
      brokerageCharges: String,
      taxAndRegistration: String,
      washroom: Boolean,
      pantryAvailability: Boolean,
      parkingAvailability: Boolean,
      marketArea: String,
      commercialZone: String,
      nearbyTransport: String,
      parkingSpaceAround: String,
    },

    // New Project Info
    newProjectInfo: {
      plotLength: { type: Number, min: 0 },
      plotWidth: { type: Number, min: 0 },
      projectName: String,
      builderName: String,
      projectType: String,
      projectStatus: String,
      approval: String,
      reraNumber: String,
      possessionDate: Date,
    },

    // Project Pricing
    projectPricing: {
      startingPrice: Number,
      priceRange: String,
      pricePerSqft: Number,
      unitConfigurations: {
        bhk2: {
          superBuildUpArea: Number,
          carpetArea: Number,
          landArea: Number,
          price: Number,
        },
        bhk3: {
          superBuildUpArea: Number,
          carpetArea: Number,
          landArea: Number,
          price: Number,
        },
        bhk4: {
          superBuildUpArea: Number,
          carpetArea: Number,
          landArea: Number,
          price: Number,
        },
      },
    },

    // Status & Meta
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'rented'],
      default: 'available',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
