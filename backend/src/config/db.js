import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/ICHGRAM";

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI);
    console.log(
      "Successfully connected to MongoDB:",
      connection.connection.host
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
