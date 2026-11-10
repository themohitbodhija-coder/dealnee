const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
  // Buy Properties
  {
    name: 'Buy Property',
    description: 'Properties available for purchase',
    icon: '🛒'
  },
  {
    name: 'New Projects',
    description: 'New residential and commercial projects',
    icon: '✨'
  },
  {
    name: 'Apartment',
    description: 'Apartments in new projects',
    icon: '🏢'
  },
  {
    name: 'Villa',
    description: 'Villas in new projects',
    icon: '🏡'
  },
  {
    name: 'Plot',
    description: 'Plots in new projects',
    icon: '🌳'
  },
  {
    name: 'Resale',
    description: 'Resale properties ready for immediate possession',
    icon: '🏠'
  },
  
  // Rent Properties
  {
    name: 'Rent Property',
    description: 'Properties available for rent',
    icon: '🔑'
  },
  
  // Commercial Properties
  {
    name: 'Commercial',
    description: 'Commercial spaces and offices',
    icon: '🏢'
  },
  {
    name: 'Commercial Buy',
    description: 'Commercial properties for purchase',
    icon: '🛒'
  },
  {
    name: 'Commercial Lease',
    description: 'Commercial properties for lease',
    icon: '📋'
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate');
    console.log('✓ Connected to MongoDB');

    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    console.log(`Found ${existingCount} existing categories`);

    // Delete existing categories (optional - comment out if you want to keep them)
    // await Category.deleteMany({});
    // console.log('✓ Cleared existing categories');

    // Insert new categories
    for (const category of categories) {
      // Check if category already exists
      const exists = await Category.findOne({ name: category.name });
      
      if (!exists) {
        await Category.create(category);
        console.log(`✓ Created category: ${category.name}`);
      } else {
        console.log(`⚠ Category already exists: ${category.name}`);
      }
    }

    // Get final count
    const finalCount = await Category.countDocuments();
    console.log(`\n✓ Seeding complete! Total categories: ${finalCount}`);

    // Display all categories
    const allCategories = await Category.find({});
    console.log('\nAll categories:');
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.icon} ${cat.name}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Connection closed');
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
