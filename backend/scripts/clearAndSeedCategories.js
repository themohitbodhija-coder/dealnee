const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');

const categories = [
  { name: 'Buy Property', icon: '🛒', description: 'Properties for purchase' },
  { name: 'Rent Property', icon: '🔑', description: 'Properties for rent' },
  { name: 'Commercial', icon: '🏢', description: 'Commercial spaces' },
  { name: 'Commercial Buy', icon: '🛒', description: 'Commercial properties for purchase' },
  { name: 'Commercial Lease', icon: '📋', description: 'Commercial properties for lease' },
];

async function clearAndSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real_estate');
    console.log('✓ Connected to MongoDB');

    // CLEAR ALL CATEGORIES
    const deletedCount = await Category.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing categories`);

    // SEED FRESH CATEGORIES
    let createdCount = 0;
    for (const category of categories) {
      const newCategory = new Category({
        name: category.name,
        icon: category.icon,
        description: category.description,
      });
      await newCategory.save();
      console.log(`✓ Created: ${category.icon} ${category.name}`);
      createdCount++;
    }

    console.log(`\n✅ Successfully seeded ${createdCount} categories from scratch!\n`);

    // SHOW ALL CATEGORIES
    const allCategories = await Category.find({});
    console.log('📋 All Categories in Database:');
    console.log('================================');
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.icon} ${cat.name} - ${cat.description}`);
    });
    console.log('================================');
    console.log(`Total: ${allCategories.length} categories\n`);

    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearAndSeed();
