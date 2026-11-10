/**
 * Migration Script: Fix Rental Property Prices
 * 
 * This script updates rental properties that don't have the price field set correctly.
 * For RENT properties, if price is 0 or null but monthlyRent is set, it sets price = monthlyRent
 */

const mongoose = require('mongoose');
const Property = require('./models/Property');
const db = require('./config/db');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
};

async function fixRentalPrices() {
  try {
    // Connect to database
    log.info('Connecting to database...');
    await db();
    log.success('Connected to database');

    // Find all rental properties with problematic prices
    log.info('Finding rental properties with missing or zero prices...');
    
    const query = {
      propertyType: 'RENT',
      $or: [
        { price: null },
        { price: 0 },
        { price: { $exists: false } },
      ],
      'rentalInfo.monthlyRent': { $exists: true, $gt: 0 },
    };

    const rentalPropertiesToFix = await Property.find(query);
    log.info(`Found ${rentalPropertiesToFix.length} rental properties to fix`);

    if (rentalPropertiesToFix.length === 0) {
      log.success('No rental properties need fixing!');
      process.exit(0);
    }

    // Update each property
    let updatedCount = 0;
    let errorCount = 0;

    for (const property of rentalPropertiesToFix) {
      try {
        const monthlyRent = property.rentalInfo?.monthlyRent;
        const oldPrice = property.price;

        if (!monthlyRent) {
          log.warn(`Skipping property ${property._id}: No monthlyRent value`);
          continue;
        }

        // Update price to monthlyRent
        property.price = Number(monthlyRent);
        await property.save();

        updatedCount++;
        log.success(
          `Updated ${property.propertyId}: ₹${oldPrice || 'N/A'} → ₹${property.price} (monthly rent)`
        );

        // Log details
        console.log(
          `  Title: ${property.title}\n` +
          `  Monthly Rent: ₹${monthlyRent}\n` +
          `  New Price: ₹${property.price}`
        );
      } catch (error) {
        errorCount++;
        log.error(
          `Failed to update property ${property._id}: ${error.message}`
        );
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    log.info('Migration Summary:');
    log.success(`Updated: ${updatedCount} properties`);
    if (errorCount > 0) {
      log.error(`Errors: ${errorCount} properties`);
    }
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
fixRentalPrices();
