const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://gaurav079t:TannuGauri3011@myfirstcluster.u9spe.mongodb.net/visitor_system?retryWrites=true&w=majority', {
    
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
