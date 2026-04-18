const mongoose = require('mongoose');

// Try SRV URI
const uri = "mongodb+srv://atharvpetu_db_user:M6Rcy23VnBXt5Cuy@ledgersync.qnrsavi.mongodb.net/?appName=LedgerSync";

console.log("Connecting to MongoDB via SRV...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection failed!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    if (err.reason) console.error("Reason:", err.reason);
    process.exit(1);
  });
