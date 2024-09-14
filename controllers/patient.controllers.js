import crypto from "crypto";
import fs from "fs/promises";
import cloudinary from "cloudinary";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import sendEmail from "../utils/sendEmail.js";
import Appointment from "../models/appointment.models.js";
import {
  DoctorSchedule,
  DoctorLeave,
} from "../models/doctorSchedule.models.js";

const cookieOptions = {
  secure: process.env.NODE_ENV === "production" ? true : false,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  SameSite: "None",
  path: "/",
  domain: process.env.NODE_ENV === "production" ? "yourlab.in" : "localhost",
};

/**
 * @REGISTER
 * @ROUTE @POST {{URL}}/api/v1/user/register
 * @ACCESS Public
 */
export const registerUser = asyncHandler(async (req, res, next) => {
  // Destructuring the necessary data from req object
  const { fullName, email, password, mobile } = req.body;
  console.log(fullName, email, password, mobile);
  // Check if the data is there or not, if not throw error message
  if (!fullName || !email || !password || !mobile) {
    return next(new AppError("All fields are required", 400));
  }

  // Check if the user exists with the provided email
  const userExists = await User.findOne({ email });

  // If user exists send the response
  if (userExists) {
    return next(new AppError("Email already exists", 409));
  }

  // Create new user with the given necessary data and save to DB
  const user = await User.create({
    fullName,
    email,
    password,
    mobile,
    avatar: {
      public_id: email,
      secure_url:
        "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
    },
  });

  // If user not created send message response
  if (!user) {
    return next(
      new AppError("User registration failed, please try again later", 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {}
  }

  // Save the user object
  await user.save();

  // Generating a JWT token
  const token = await user.generateJWTToken();

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Setting the token in the cookie with name token along with cookieOptions
  res.cookie("token", token, cookieOptions);

  // If all good send the response to the frontend
  res
    .status(201)
    .json(new ApiResponse(200, { user, token }, "User created successfully"));
});

/**
 * @LOGIN
 * @ROUTE @POST {{URL}}/api/v1/user/login
 * @ACCESS Public
 */
export const loginUser = asyncHandler(async (req, res, next) => {
  // Destructuring the necessary data from req object
  const { email, password } = req.body;

  // Check if the data is there or not, if not throw error message
  if (!email || !password) {
    return next(new AppError("Email and Password are required", 400));
  }

  // Finding the user with the sent email
  const user = await User.findOne({ email }).select("+password");

  // If no user or sent password do not match then send generic response
  if (!(user && (await user.comparePassword(password)))) {
    return next(
      new AppError("Email or Password do not match or user does not exist", 401)
    );
  }

  // Generating a JWT token
  const token = await user.generateJWTToken();

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Setting the token in the cookie with name token along with cookieOptions
  res.cookie("token", token, cookieOptions);

  // If all good send the response to the frontend
  res
    .status(201)
    .json(new ApiResponse(200, { user, token }, "Logged in  successfully"));
});

/**
 * @LOGOUT
 * @ROUTE @POST {{URL}}/api/v1/user/logout
 * @ACCESS Public
 */
export const logoutUser = asyncHandler(async (_req, res, _next) => {
  // Setting the cookie value to null
  console.log("logout");
  res.cookie("token", null, {
    secure: process.env.NODE_ENV === "production" ? true : false,
    maxAge: 0,
    httpOnly: true,
  });

  // Sending the response
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

/**
 * @LOGGED_IN_USER_DETAILS
 * @ROUTE @GET {{URL}}/api/v1/user/me
 * @ACCESS Private(Logged in users only)
 */
export const getLoggedInUserDetails = asyncHandler(async (req, res, _next) => {
  // Finding the user using the id from modified req object
  const user = await User.findById(req.user.id);
  console.log(user);

  res.status(200).json({
    success: true,
    message: "User details",
    user,
  });
});

/**
 * @FORGOT_PASSWORD
 * @ROUTE @POST {{URL}}/api/v1/user/reset
 * @ACCESS Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  // Extracting email from request body
  const { email } = req.body;
  //console.log(email)

  // If no email send email required message
  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  // Finding the user via email
  const user = await User.findOne({ email });

  // If no email found send the message email not found
  if (!user) {
    return next(new AppError("Email not registered", 400));
  }

  // Generating the reset token via the method we have in user model
  const resetToken = await user.generatePasswordResetToken();

  // Saving the forgotPassword* to DB
  await user.save();

  // constructing a url to send the correct data
  /**HERE
   * req.protocol will send if http or https
   * req.get('host') will get the hostname
   * the rest is the route that we will create to verify if token is correct or not
   */
  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/user/reset/${resetToken}`;
  const resetPasswordUrl = `${process.env.FRONTEND_URL}user/reset/${resetToken}`;

  // We here need to send an email to the user with the token
  const subject = "Reset Password";
  const message = `You can reset your password by clicking   <a href=${resetPasswordUrl} target="_blank">Reset your password</a>  \nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

  try {
    await sendEmail(email, subject, message);

    // If email sent successfully send the success response
    res.status(200).json({
      success: true,
      message: `Reset password token has been sent to ${email} successfully`,
    });
  } catch (error) {
    // If some error happened we need to clear the forgotPassword* fields in our DB
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    return next(
      new AppError(
        error.message || "Something went wrong, please try again.",
        500
      )
    );
  }
});

/**
 * @RESET_PASSWORD
 * @ROUTE @POST {{URL}}/api/v1/user/reset/:resetToken
 * @ACCESS Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Extracting resetToken from req.params object
  const { resetToken } = req.params;
  // console.log(resetToken)

  // Extracting password from req.body object
  const { password } = req.body;
  // console.log( 'passward  is ',password)

  // We are again hashing the resetToken using sha256 since we have stored our resetToken in DB using the same algorithm
  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Check if password is not there then send response saying password is required
  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  console.log(forgotPasswordToken);

  // Checking if token matches in DB and if it is still valid(Not expired)
  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() }, // $gt will help us check for greater than value, with this we can check if token is valid or expired
  });

  // If not found or expired send the response
  if (!user) {
    return next(
      new AppError("Token is invalid or expired, please try again", 400)
    );
  }

  // Update the password if token is valid and not expired
  user.password = password;

  // making forgotPassword* valus undefined in the DB
  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  // Saving the updated user values
  await user.save();

  // Sending the response when everything goes good
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * @CHANGE_PASSWORD
 * @ROUTE @POST {{URL}}/api/v1/user/change-password
 * @ACCESS Private (Logged in users only)
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  // Destructuring the necessary data from the req object
  const { oldPassword, newPassword } = req.body;
  // console.log(oldPassword,newPassword)
  const { id } = req.user; // because of the middleware isLoggedIn

  // Check if the values are there or not
  if (!oldPassword || !newPassword) {
    return next(
      new AppError("Old password and new password are required", 400)
    );
  }

  // Finding the user by ID and selecting the password
  const user = await User.findById(id).select("+password");

  // If no user then throw an error message
  if (!user) {
    return next(new AppError("Invalid user id or user does not exist", 400));
  }

  // Check if the old password is correct
  const isPasswordValid = await user.comparePassword(oldPassword);

  // If the old password is not valid then throw an error message
  if (!isPasswordValid) {
    return next(new AppError("Invalid old password", 400));
  }

  // Setting the new password
  user.password = newPassword;

  // Save the data in DB
  await user.save();

  // Setting the password undefined so that it won't get sent in the response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * @UPDATE_USER
 * @ROUTE @POST {{URL}}/api/v1/user/update/:id
 * @ACCESS Private (Logged in user only)
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  // Destructuring the necessary data from the req object
  const { fullName, mobile } = req.body;

  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("Invalid user id or user does not exist"));
  }

  if (fullName) {
    user.fullName = fullName;
  }
  if (mobile) {
    user.mobile = mobile;
  }

  // Run only if user sends a file
  if (req.file) {
    // Deletes the old image uploaded by the user
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(
        new AppError(error || "File not uploaded, please try again", 400)
      );
    }
  }

  // Save the user object
  await user.save();

  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    user,
  });
});

function generateRandomID(patientName, appointmentDate) {
  // Function to generate a random alphanumeric character
  function getRandomChar() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Ensure patientName has at least 2 characters
  const namePart = patientName.slice(0, 2).toUpperCase();

  // Extract day, month, and year from the appointmentDate
  const [day, month, year] = appointmentDate.split("/");

  // Ensure appointmentMonth is two digits
  const monthPart = ("0" + month).slice(-2);

  // Ensure appointmentYear is four digits
  const yearPart = ("000" + year).slice(-4);

  // Generate the rest of the ID with random characters to reach 12 characters in total
  const randomPartLength =
    14 - namePart.length - monthPart.length - yearPart.length;
  let randomPart = "";
  for (let i = 0; i < randomPartLength; i++) {
    randomPart += getRandomChar();
  }

  // Combine all parts to form the final ID
  const id = namePart + yearPart + monthPart + randomPart;

  return id;
}

export const newAppointment = asyncHandler(async (req, res) => {
  const {
    patientName,
    patientPhone,
    age,
    gender,
    diabetes,
    bloodPressure,
    weight,
    description,
    slotId,
    time,
    date,
  } = req.body;
  const { doctorId } = req.params;

  if (
    !patientName ||
    !patientPhone ||
    !age ||
    !gender ||
    !diabetes ||
    !weight ||
    !bloodPressure ||
    !weight ||
    !description ||
    !slotId ||
    !date ||
    !time
  ) {
    throw new AppError(400, "All field are required ");
  }

  try {
    // Find the slot and check availability
    const userId = req.user.id;

    const doctorSchedule = await DoctorSchedule.findOne({
      "slots._id": slotId,
      doctorId,
    });
    if (!doctorSchedule) {
      throw new AppError("Doctor or Slot not found ");
    }
    const slot = doctorSchedule.slots.id(slotId);

    if (!slot || slot.availableSlot <= 0) {
      return res.status(400).json({ message: "Slot not available" });
    }
    const patientId = generateRandomID(patientName, date);

    // Create a new appointment
    const newAppointment = new Appointment({
      doctorId,
      patientName,
      patientPhone,
      age,
      gender,
      diabetes,
      bloodPressure,
      weight,
      description,
      slotId,
      date,
      patientId,
      time,
      userId,
    });

    // Save the appointment
    const savedAppointment = await newAppointment.save();

    // Update the slot with the new appointment

    slot.availableSlot -= 1;
    await doctorSchedule.save();

    // Add the appointment to the doctor's appointments list

    res.status(200).json({
      success: true,
      message: "Appointment done successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    throw new AppError("failed to create appointment ", 400);
  }
});

export const getScheduleByDatePatient = asyncHandler(async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.params;
    console.log("date is ", date);
    console.log("params ", doctorId);

    // Validate doctorId
    if (!doctorId) {
      throw new AppError("Doctor ID is required", 400);
    }

    // Validate date
    if (!date) {
      throw new AppError("Date is required", 400);
    }

    const formattedDate = new Date(date);

    // Check if the date is valid
    if (isNaN(formattedDate.getTime())) {
      throw new AppError("Invalid date format", 400);
    }

    console.log(formattedDate);

    // Check if the doctor is on leave on the given date
    const leave = await DoctorLeave.findOne({
      doctorId,
      startDate: { $lte: formattedDate },
      endDate: { $gte: formattedDate },
    });

    if (leave) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            `Doctor is on leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`
          )
        );
    }

    // Find the schedule for the given date
    const schedule = await DoctorSchedule.findOne({
      doctorId,
      date: formattedDate,
    });

    if (!schedule) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "No schedule found for the given date")
        );
    }

    res.status(200).json(new ApiResponse(200, schedule, "Schedule found"));
  } catch (error) {
    if (error instanceof AppError) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, null, error.message));
    } else {
      console.error("Unexpected error:", error);
      res
        .status(500)
        .json(new ApiResponse(500, null, "An unexpected error occurred"));
    }
  }
});

export const allAppointmentByUser = asyncHandler(async (req, res, next) => {
  // getting the user id
  const userId = req.user.id;

  try {
    const appointments = await Appointment.find({ userId });
    if (!appointments) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No Appointemnts found "));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, appointments, "Appointments  found Successfully ")
      );
  } catch (error) {
    if (error instanceof AppError) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, null, error.message));
    } else {
      console.error("Unexpected error:", error);
      res
        .status(500)
        .json(new ApiResponse(500, null, "An unexpected error occurred"));
    }
  }
});
