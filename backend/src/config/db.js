const mongoose = require('mongoose');

// Reuse one connection across calls. Serverless platforms (Vercel) invoke the
// handler repeatedly in a warm instance, and opening a new connection each time
// would exhaust the database's connection limit.
let connecting = null;

async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m.connection;
      })
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  return connecting;
}

module.exports = connectDB;
