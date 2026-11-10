# How to Seed Categories

## Step 1: Open Terminal and Navigate to Server

```bash
cd server
```

## Step 2: Run the Seeding Script

```bash
node scripts/seedCategories.js
```

## What It Does

The script will:
1. ✓ Connect to your MongoDB database
2. ✓ Check for existing categories
3. ✓ Add all missing categories (won't duplicate)
4. ✓ Display all categories created
5. ✓ Close the connection

## Categories Created

**Buy Properties:**
- 🛒 Buy Property
- ✨ New Projects
- 🏢 Apartment
- 🏡 Villa
- 🌳 Plot
- 🏠 Resale

**Rent Properties:**
- 🔑 Rent Property

**Commercial Properties:**
- 🏢 Commercial
- 🛒 Commercial Buy
- 📋 Commercial Lease

## Expected Output

```
✓ Connected to MongoDB
Found 3 existing categories
✓ Created category: Buy Property
✓ Created category: New Projects
✓ Created category: Apartment
✓ Created category: Villa
✓ Created category: Plot
✓ Created category: Resale
✓ Created category: Rent Property
✓ Created category: Commercial
✓ Created category: Commercial Buy
✓ Created category: Commercial Lease

✓ Seeding complete! Total categories: 13

All categories:
1. 🛒 Buy Property
2. ✨ New Projects
3. 🏢 Apartment
4. 🏡 Villa
5. 🌳 Plot
6. 🏠 Resale
7. 🔑 Rent Property
8. 🏢 Commercial
9. 🛒 Commercial Buy
10. 📋 Commercial Lease

✓ Connection closed
```

## After Running

1. Go to Admin Dashboard
2. Click "Add Property"
3. Click on Category button
4. You should now see all 10 categories organized into 3 groups!

---

**Note:** The script is safe to run multiple times - it won't create duplicates.
