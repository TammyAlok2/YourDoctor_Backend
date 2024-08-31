import { DoctorSchedule,DoctorLeave } from "../models/doctorSchedule.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";

export const createLeave = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  console.log(doctorId);

  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      throw new AppError("Start date and end date are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of the day for accurate comparison

    if (start >= end) {
      throw new AppError("Start date must be before end date", 400);
    }

    if (start < today) {
      throw new AppError("Cannot create leave for a past date", 400);
    }

    // Check for existing overlapping leaves
    const existingLeave = await DoctorLeave.findOne({
      doctorId,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } }
      ]
    });

    if (existingLeave) {
      throw new AppError("There is an overlapping leave in the specified period", 400);
    }

    const newLeave = new DoctorLeave({
      doctorId,
      startDate: start,
      endDate: end,
      reason
    });

    await newLeave.save();

    // Remove any existing schedules within the leave period
    await DoctorSchedule.deleteMany({
      doctorId,
      date: { $gte: start, $lte: end }
    });

    res.status(200).json(
      new ApiResponse(200, newLeave, "Leave created successfully")
    );
  } catch (error) {
    throw new AppError(error.message || "Error creating leave", error.statusCode || 400);
  }
});

  export const deleteLeave = asyncHandler(async (req, res, next) => {
    const { leaveId } = req.params;
    const doctorId = req.user.id;
  
    const leave = await DoctorLeave.findOne({ _id: leaveId, doctorId });
  
    if (!leave) {
      throw new AppError("Leave not found or you don't have permission to delete it", 400);
    }
  
    await leave.deleteOne();
  
    res.status(200).json(
      new ApiResponse(200, null, "Leave deleted successfully")
    );
  });
  
  export const updateLeave = asyncHandler(async (req, res, next) => {
    const { leaveId } = req.params;
    const { startDate, endDate, reason } = req.body;
    const doctorId = req.user.id;
  
    const leave = await DoctorLeave.findOne({ _id: leaveId, doctorId });
  
    if (!leave) {
      throw new AppError(404, "Leave not found or you don't have permission to update it");
    }
  
    // Check if there are any existing schedules within the new leave period
    const conflictingSchedules = await DoctorSchedule.find({
      doctorId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });
  
    if (conflictingSchedules.length > 0) {
      throw new AppError(400, "Cannot update leave. Conflicting schedules exist within the new leave period");
    }
  
    leave.startDate = startDate || leave.startDate;
    leave.endDate = endDate || leave.endDate;
    leave.reason = reason || leave.reason;
  
    await leave.save();
  
    res.status(200).json(
      new ApiResponse(200, leave, "Leave updated successfully")
    );
  });
  
  export const getLeaves = asyncHandler(async (req, res, next) => {
    const doctorId = req.user.id;
  
    const leaves = await DoctorLeave.find({ doctorId }).sort({ startDate: 1 });
  
    if (!leaves || leaves.length === 0) {
      throw new AppError(404, "No leaves found");
    }
  
    res.status(200).json(
      new ApiResponse(200, leaves, "Leaves fetched successfully")
    );
  });