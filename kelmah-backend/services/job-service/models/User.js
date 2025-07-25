const mongoose = require("mongoose");
const { Schema } = mongoose;

// Stub User schema for populate
const UserSchema = new Schema({}, { strict: false });
module.exports = mongoose.model("User", UserSchema);
