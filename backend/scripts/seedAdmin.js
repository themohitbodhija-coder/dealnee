const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();
async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || !process.env.MONGODB_URI) {
    throw new Error('Set MONGODB_URI, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD first');
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    if (await User.findOne({ email })) {
      console.log('Account already exists; no changes made.');
      return;
    }
    await User.create({ name: 'Admin User', email, password, role: 'admin' });
    console.log('Admin account created. Credentials are not printed.');
  } finally { await mongoose.disconnect(); }
}
seedAdmin().catch(() => { console.error('Admin seeding failed; check local configuration.'); process.exitCode = 1; });
