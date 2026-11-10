const mongoose = require('mongoose');
require('dotenv').config();

// Import the Property model
const Property = require('./models/Property');

async function updatePropertyType() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('? Connected to MongoDB');

    const propertyIds = ['6a0ef500cdff76f557d88ac9', '6a0ef364cdff76f557d88a6e'];

    console.log('\n--- Updating Properties ---');

    for (const id of propertyIds) {
      // First, get the current property data
      const currentProperty = await Property.findById(id);
      
      if (!currentProperty) {
        console.log(`? Property with ID ${id} not found`);
        continue;
      }

      console.log(`\nProperty ID: ${id}`);
      console.log(`Current propertyType: ${currentProperty.propertyType}`);

      // Update the property
      const updatedProperty = await Property.findByIdAndUpdate(
        id,
        { propertyType: 'RENT' },
        { new: true }
      );

      if (updatedProperty) {
        console.log(`? Updated propertyType to: ${updatedProperty.propertyType}`);
        console.log(`  Title: ${updatedProperty.title}`);
        console.log(`  Location: ${updatedProperty.location.city}, ${updatedProperty.location.state}`);
      }
    }

    console.log('\n? Update completed successfully');

  } catch (error) {
    console.error('? Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the update
updatePropertyType();
