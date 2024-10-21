import crypto from "crypto";
import Admin from "../models/admin.models.js"; // Assuming you've created the Admin model
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import sendEmail from "../utils/sendEmail.js";
import Appointment from "../models/appointment.models.js";

// Cookie options
const cookieOptions = {
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  SameSite: "none",
};

/**
 * @REGISTER_ADMIN
 * @ROUTE @POST {{URL}}/api/v1/admin/register
 * @ACCESS Public
 */
export const registerAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, mobileNumber,role } = req.body;
  console.log(fullName,email,password,mobileNumber)

  // Validate input fields
  if (!fullName || !email || !password || !mobileNumber) {
    return next(new AppError("All fields are required", 400));
  }

  // Check if the admin already exists
  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return next(new AppError("Email already exists", 409));
  }

  // Create new admin
  const admin = await Admin.create({ fullName, email, password, mobileNumber,role });

  if (!admin) {
    return next(new AppError("Admin registration failed", 400));
  }

  // Generate JWT token
  const token = await admin.generateJWTToken();

  // Set cookie
  res.cookie("token", token, cookieOptions);

  // Hide password from response
  admin.password = undefined;

  // Respond to frontend
  res.status(201).json(new ApiResponse(201, admin, "Admin registered successfully"));
});

/**
 * @LOGIN_ADMIN
 * @ROUTE @POST {{URL}}/api/v1/admin/login
 * @ACCESS Public
 */
export const loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and Password are required", 400));
  }

  // Find admin by email and include password field
  const admin = await Admin.findOne({ email }).select("+password");

  // Check if admin exists and password matches
  if (!admin || !(await admin.comparePassword(password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  // Generate token
  const token = await admin.generateJWTToken();

  // Set cookie
  res.cookie("token", token, cookieOptions);

  // Hide password from response
  admin.password = undefined;

  res.status(200).json(new ApiResponse(200, admin, "Admin logged in successfully"));
});

/**
 * @LOGOUT_ADMIN
 * @ROUTE @POST {{URL}}/api/v1/admin/logout
 * @ACCESS Private
 */
export const logoutAdmin = asyncHandler(async (req, res, next) => {
  // Clear cookie
  res.cookie("token", null, { maxAge: 0, httpOnly: true });

  res.status(200).json({ success: true, message: "Admin logged out successfully" });
});

/**
 * @GET_LOGGED_IN_ADMIN_DETAILS
 * @ROUTE @GET {{URL}}/api/v1/admin/me
 * @ACCESS Private
 */
export const getLoggedInAdminDetails = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Admin details retrieved successfully",
    admin,
  });
});

/**
 * @FORGOT_PASSWORD
 * @ROUTE @POST {{URL}}/api/v1/admin/forgot-password
 * @ACCESS Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return next(new AppError("Email not registered", 404));
  }

  const otp = await admin.generatePasswordResetToken();
  await admin.save();

  const subject = "Your Admin Password Reset OTP";
  const message = `Your OTP for resetting your password is: ${otp}\nThis OTP is valid for 15 minutes.`;

  try {
    await sendEmail(email, subject, message);
    res.status(200).json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    admin.forgotPasswordToken = undefined;
    admin.forgotPasswordExpiry = undefined;
    await admin.save();

    return next(new AppError("Error sending email. Try again later.", 500));
  }
});

/**
 * @RESET_PASSWORD
 * @ROUTE @POST {{URL}}/api/v1/admin/reset-password/:resetToken
 * @ACCESS Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const admin = await Admin.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!admin) {
    return next(new AppError("Invalid or expired token", 400));
  }

  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  admin.password = password;
  admin.forgotPasswordToken = undefined;
  admin.forgotPasswordExpiry = undefined;
  await admin.save();

  res.status(200).json({ success: true, message: "Password reset successfully" });
});

/**
 * @UPDATE_PROFILE
 * @ROUTE @PUT {{URL}}/api/v1/admin/update-profile
 * @ACCESS Private
 */
export const updateAdminProfile = asyncHandler(async (req, res, next) => {
  const { fullName, mobileNumber } = req.body;
  const admin = await Admin.findById(req.user.id);

  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  admin.fullName = fullName || admin.fullName;
  admin.mobileNumber = mobileNumber || admin.mobileNumber;

  await admin.save();

  res.status(200).json({
    success: true,
    message: "Admin profile updated successfully",
    admin,
  });
});


/**
 * @CHANGE_PASSWORD
 * @ROUTE @PUT {{URL}}/api/v1/admin/change-password
 * @ACCESS Private
 */
export const changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
  
    if (!oldPassword || !newPassword) {
      return next(new AppError('Old password and new password are required', 400));
    }
  
    const admin = await Admin.findById(req.user.id).select('+password'); // Fetch the admin with password
  
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }
  
    // Check if the old password is correct
    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) {
      return next(new AppError('Old password is incorrect', 401));
    }
  
    // Set new password
    admin.password = newPassword;
  
    // Save the updated admin document
    await admin.save();
  
    // Respond to the client
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });
  

  // finding appointment for the doctor 
  export const getAppointmentsByDoctor = asyncHandler(async (req, res, next) => {
    const {doctorId} = req.params; // taking doctor id 
    const appointments = await Appointment.find({ doctorId });
  
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
      message: "appointment fetched successfully",
    });
  });