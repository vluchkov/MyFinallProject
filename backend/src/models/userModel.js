import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+?[0-9]{7,14}$/, 'Invalid phone number']
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
  },
  bio: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: true,
    minlength: "5",
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для постов
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author'
});

const User = mongoose.model("User", userSchema);
export default User;