const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

async function fixCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete incorrect lowercase categories
    const result = await Category.deleteMany({ 
      name: { $in: ['villa', 'plot'] } 
    });
    console.log('✓ Deleted incorrect categories:', result.deletedCount);
    
    // Verify categories
    const categories = await Category.find({});
    console.log('\nRemaining categories:');
    categories.forEach(cat => {
      console.log('- ' + cat.name);
    });
    
    await mongoose.disconnect();
    console.log('\n✓ Done');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixCategories();
