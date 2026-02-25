import mongoose from "mongoose";

const connectDB = async () => {
    const url = process.env.MONGO_URI;
    if (!url) {
        throw new Error("MongoURI not provided");
    }

    await mongoose.connect(url, {
        dbName: "UserServiceDB"
    });

    console.log('Successfully Connected to the Database');
};

export default connectDB;
