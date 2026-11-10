const mongoose = require('mongoose');
require('./models/Category');
const Property = require('./models/Property');
require('dotenv').config();

async function fixPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update Property 1: Resale Villa -> 2.5 Crores
    await Property.findByIdAndUpdate(
      '6a15233d700a84a68d01a7b5',
      { price: 25000000 }, // 2.5 Crores
      { new: true }
    );
    console.log('✓ Updated Property 1 - Price: ₹2.5 Cr');
    
    // Update Property 2: Commercial Office -> 1.2 Crores
    await Property.findByIdAndUpdate(
      '6a15249b700a84a68d01a7ca',
      { price: 12000000 }, // 1.2 Crores
      { new: true }
    );
    console.log('✓ Updated Property 2 - Price: ₹1.2 Cr');
    
    // Update Property 3: Rental Villa -> 75K (monthly rent)
    await Property.findByIdAndUpdate(
      '6a1529c2aacb719023688b31',
      { price: 75000 }, // 75K monthly rent
      { new: true }
    );
    console.log('✓ Updated Property 3 - Price: ₹75K/Month');
    
    // Update Property 4: Commercial Office -> 1.8 Crores
    await Property.findByIdAndUpdate(
      '6a152a46aacb719023688b46',
      { price: 18000000 }, // 1.8 Crores
      { new: true }
    );
    console.log('✓ Updated Property 4 - Price: ₹1.8 Cr');
    
    // Verify updates
    console.log('\n=== UPDATED PROPERTIES WITH PRICES ===');
    const properties = await Property.find({}).populate('category');
    properties.forEach((prop, idx) => {
      const formatPrice = (price) => {
        if (!price || price === 0) return '₹N/A';
        const num = parseInt(price);
        if (num >= 10000000) {
          return `₹${(num / 10000000).toFixed(1)} Cr`;
        } else if (num >= 100000) {
          return `₹${(num / 100000).toFixed(1)} Lac`;
        } else if (num >= 1000) {
          return `₹${(num / 1000).toFixed(1)}K`;
        }
        return `₹${num}`;
      };
      
      console.log((idx+1) + '. Title:', prop.title);
      console.log('   Price:', formatPrice(prop.price));
      console.log('   PropertyType:', prop.propertyType);
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✓ Done - All prices updated!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixPrices();
