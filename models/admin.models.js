import crypto from 'crypto';

import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { kStringMaxLength } from 'buffer';


const adminSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [5, 'Name must be at least 5 characters'],
      trim: true, // Removes unnecessary spaces
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please fill in a valid email address',
      ], // Matches email against regex
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Will not select password upon looking up a document
    },
    role:{
      type:String,
      enum:['Telecaller','Admin','Recieption'],
      default:'Admin',
    },

    mobileNumber:{
      type:Number,
      required:true,
    },
    
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    
  },
  
  {
    timestamps: true,
  }
);

// Hashes password before saving to the database
adminSchema.pre('save', async function (next) {
  // If password is not modified then do not hash it
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods = {
  // method which will help us compare plain password with hashed password and returns true or false
  comparePassword: async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  },

  // Will generate a JWT token with user id as payload
  generateJWTToken: async function () {
    return await jwt.sign(
      { id: this._id, role: this.role, subscription: this.subscription },
      'SECRET',
      {
        expiresIn: '7d',
      }
    );
  },

  // This will generate a token for password reset
  generatePasswordResetToken: async function () {
    // creating a random token using node's built-in crypto module
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP using SHA-256 algorithm and store it in the database
    this.forgotPasswordToken = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set the OTP expiry time to 15 minutes
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;

    // Return the plain OTP (not hashed)
    return otp;
  },
};


const Admin = model('Admin', adminSchema);
export default Admin;