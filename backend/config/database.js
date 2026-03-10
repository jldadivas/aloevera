const mongoose = require("mongoose");

const connectToDatabase = () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('Database URI missing. Set MONGO_URI or MONGODB_URI.');
    return;
  }

  mongoose
    .connect(mongoUri)
    .then((con) => console.log(`connected to database ${con.connection.host}`))
    .catch((error) => console.log(error.message));
};

module.exports = connectToDatabase;
