const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);

    // Provide actionable guidance for the most common Atlas issue (IP whitelist)
    console.error('Possible causes:');
    console.error('- Your current IP address is not allowed in the MongoDB Atlas Network Access list.');
    console.error("- The connection string in your .env (MONGODB_URI) is incorrect or uses special characters that need URL-encoding.");
    console.error('- Network/firewall blocking outbound connections to Atlas (port 27017).');
    console.error('If you are developing locally, you can temporarily allow access from anywhere in Atlas (0.0.0.0/0) or add your IP: https://www.mongodb.com/docs/atlas/security-ip-access-list/');

    // In development, try a local MongoDB fallback if available
    if (process.env.NODE_ENV !== 'production') {
      const fallback = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/realstate';
      console.log(`Attempting fallback to local MongoDB at ${fallback} (development only)...`);
      try {
        const localConn = await mongoose.connect(fallback, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log(`✓ Connected to fallback local MongoDB: ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        console.error(`✗ Local MongoDB fallback failed: ${localErr.message}`);
      }
    }

    // Still failing — exit so the developer notices and fixes the DB access
    console.error('MongoDB connection could not be established. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;
