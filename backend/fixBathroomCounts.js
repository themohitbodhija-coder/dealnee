const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

async function fixBathroomCounts() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realstate';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB at', uri);

    const properties = await Property.find({});
    let updated = 0;

    for (const property of properties) {
      const candidates = [
        Number(property.bathroom2),
        Number(property.bathrooms),
      ].filter((value) => Number.isFinite(value));

      const target = candidates.length ? Math.max(...candidates) : 0;

      if (property.bathrooms !== target || property.bathroom2 !== target) {
        property.bathrooms = target;
        property.bathroom2 = target;
        await property.save();
        updated++;
        console.log(`Updated ${property.propertyId || property._id}: bathrooms=${property.bathrooms}, bathroom2=${property.bathroom2}`);
      }
    }

    console.log(`Done. Total properties checked: ${properties.length}. Updated: ${updated}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating bathroom counts:', error);
    process.exit(1);
  }
}

fixBathroomCounts();
