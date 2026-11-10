/*
  One-off migration script to remove pincode, contact.name, and contact.email from existing Property documents.
  Usage (from server folder):
    node scripts/removeContactAndPincode.js
  Make sure MONGODB_URI is set in your environment or .env before running.
*/

const mongoose = require('mongoose');
const Property = require('../models/Property');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/realstate';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for migration');

    const result = await Property.updateMany(
      {},
      {
        $unset: {
          'location.pincode': '',
          'contact.name': '',
          'contact.email': '',
        },
      }
    );

    console.log('Migration complete. Modified count:', result.modifiedCount || result.nModified || 0);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
