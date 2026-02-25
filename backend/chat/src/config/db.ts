import mongoose from "mongoose";

const connectDB = async() => {
    const uri = process.env.MONGO_URI;
    if(!uri){
        throw new Error("MongoURI not provided");
    }
    await mongoose.connect(uri,{
        dbName:"ChatServiceDB"
    });
    console.log('Successfully connected to MONGODB');
};

export default connectDB;