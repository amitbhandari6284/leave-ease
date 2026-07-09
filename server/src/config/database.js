import mongoose from "mongoose";

export default async function connectDB() {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connection successful: ${connection.connection.host}/${connection.connection.name}`);
  } catch (error) {
    console.log(`MongoDB connection fail: ${error.message}`);
    process.exit(1);
  }
}
