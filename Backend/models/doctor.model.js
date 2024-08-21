import crypto from 'crypto';

import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { kStringMaxLength } from 'buffer';

const doctorSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [5, 'Name must be at least 5 characters'],
      lowercase: true,
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
    
    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    specialist:{
        type:String,
        required:true,
    },
    description:{
type:String,
required:true,
    },
    mobileNumber:{
      type:Number,
      required:true,
    },
    address:{
      type:String,
      required:true
    },
    pincode:{
      type:Number,
      required:true
    },
    status:{
type:Boolean,
enum:[true,false],
default:false,
    },
    fees: {
      firstVisitFee: {
        type: String,
       
      },
      secondVisitFee: {
        type: String,
        
      },
      visitUnder7DaysFee: {
        type: String,
       
      },
      emergencyFee1: {
        type:String,
      
      },
      emergencyFee2: {
        type: String,
       
      }
    },
  
       appointments:[
        {
           type: Schema.Types.ObjectId,
              ref: "Appointment",
              select:false,
        }
       ],
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    
  },
  
  {
    timestamps: true,
  }
);

// Hashes password before saving to the database
doctorSchema.pre('save', async function (next) {
  // If password is not modified then do not hash it
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
});

doctorSchema.methods = {
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


const Doctor = model('Doctor', doctorSchema);
export default Doctor;