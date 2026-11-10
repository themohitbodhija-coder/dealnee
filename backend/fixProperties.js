const mongoose = require('mongoose');
require('./models/Category');
const Property = require('./models/Property');
require('dotenv').config();

async function fixProperties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update Property 1: BUY, Resale -> Add RESALE_VILLA subcategory and proper title
    await Property.findByIdAndUpdate(
      '6a15233d700a84a68d01a7b5',
      { 
        title: 'Beautiful Resale Villa in Prime Location',
        subcategory: 'RESALE_VILLA',
        description: 'Spacious villa with modern amenities and excellent location'
      }
    );
    console.log('✓ Updated Property 1');
    
    // Update Property 2: COMMERCIAL, Commercial Buy -> Already has COMMERCIAL_OFFICE_SALE
    await Property.findByIdAndUpdate(
      '6a15249b700a84a68d01a7ca',
      { 
        title: 'Prime Commercial Office Space',
        description: 'Modern office space in commercial building'
      }
    );
    console.log('✓ Updated Property 2');
    
    // Update Property 3: RENT, Rent Property -> Add RENTAL_VILLA subcategory and proper title
    await Property.findByIdAndUpdate(
      '6a1529c2aacb719023688b31',
      { 
        title: 'Spacious Rental Villa',
        subcategory: 'RENTAL_VILLA',
        description: 'Comfortable villa available for rent with modern facilities'
      }
    );
    console.log('✓ Updated Property 3');
    
    // Update Property 4: COMMERCIAL, Commercial Buy -> Already has COMMERCIAL_OFFICE_SALE
    await Property.findByIdAndUpdate(
      '6a152a46aacb719023688b46',
      { 
        title: 'Commercial Office Space in Business Park',
        description: 'Well-located office space for businesses'
      }
    );
    console.log('✓ Updated Property 4');
    
    // Verify updates
    console.log('\n=== UPDATED PROPERTIES ===');
    const properties = await Property.find({}).populate('category');
    properties.forEach((prop, idx) => {
      console.log((idx+1) + '. Title:', prop.title);
      console.log('   PropertyType:', prop.propertyType);
      console.log('   Category:', prop.category?.name);
      console.log('   Subcategory:', prop.subcategory);
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✓ Done');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixProperties();
