import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export async function connectToMongos() {
  try {
    const url = `${process.env.MONGODB_URL}`;
    console.log("connecting to", url);
    return await mongoose.connect(url);
  } catch (error) {
    console.log("error connecting to MongoDB:", error.message);
    return undefined;
  }
}
