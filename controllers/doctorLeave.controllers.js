import { DoctorSchedule, DoctorLeave } from "../models/doctorSchedule.models.js";
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

    if (!reason || reason.trim().length === 0) {
      throw new AppError("Reason for leave is required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("Invalid date format. Please use YYYY-MM-DD", 400);
    }

    if (start > end) {
      throw new AppError("Start date must be before end date", 400);
    }

    if (start < today) {
      throw new AppError("Cannot create leave for a past date", 400);
    }

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

    await DoctorSchedule.deleteMany({
      doctorId,
      date: { $gte: start, $lte: end }
    });

    res.status(200).json(
      new ApiResponse(200, newLeave, "Leave created successfully")
    );
  } catch (error) {
    res.status(error.statusCode || 400).json(
      new ApiResponse(error.statusCode || 400, null, error.message || "Error creating leave")
    );
  }
});

export const deleteLeave = asyncHandler(async (req, res) => {
  try {
    const { leaveId } = req.params;
    const doctorId = req.user.id;

    if (!leaveId) {
      throw new AppError("Leave ID is required", 400);
    }

    const leave = await DoctorLeave.findOne({ _id: leaveId, doctorId });

    if (!leave) {
      throw new AppError("Leave not found or you don't have permission to delete it", 404);
    }

    await leave.deleteOne();

    res.status(200).json(
      new ApiResponse(200, null, "Leave deleted successfully")
    );
  } catch (error) {
    res.status(error.statusCode || 400).json(
      new ApiResponse(error.statusCode || 400, null, error.message || "Error deleting leave")
    );
  }
});

export const updateLeave = asyncHandler(async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { startDate, endDate, reason } = req.body;
    const doctorId = req.user.id;

    if (!leaveId) {
      throw new AppError("Leave ID is required", 400);
    }

    const leave = await DoctorLeave.findOne({ _id: leaveId, doctorId });

    if (!leave) {
      throw new AppError("Leave not found or you don't have permission to update it", 404);
    }

    if (startDate) {
      const newStart = new Date(startDate);
      if (isNaN(newStart.getTime())) {
        throw new AppError("Invalid start date format. Please use YYYY-MM-DD", 400);
      }
      leave.startDate = newStart;
    }

    if (endDate) {
      const newEnd = new Date(endDate);
      if (isNaN(newEnd.getTime())) {
        throw new AppError("Invalid end date format. Please use YYYY-MM-DD", 400);
      }
      leave.endDate = newEnd;
    }

    if (leave.startDate >= leave.endDate) {
      throw new AppError("Start date must be before end date", 400);
    }

    const conflictingSchedules = await DoctorSchedule.find({
      doctorId,
      date: { $gte: leave.startDate, $lte: leave.endDate }
    });

    if (conflictingSchedules.length > 0) {
      throw new AppError("Cannot update leave. Conflicting schedules exist within the new leave period", 400);
    }

    if (reason) {
      leave.reason = reason;
    }

    await leave.save();

    res.status(200).json(
      new ApiResponse(200, leave, "Leave updated successfully")
    );
  } catch (error) {
    res.status(error.statusCode || 400).json(
      new ApiResponse(error.statusCode || 400, null, error.message || "Error updating leave")
    );
  }
});

export const getLeaves = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user.id;

    const leaves = await DoctorLeave.find({ doctorId }).sort({ startDate: 1 });

    if (!leaves || leaves.length === 0) {
      throw new AppError("No leaves found", 404);
    }

    res.status(200).json(
      new ApiResponse(200, leaves, "Leaves fetched successfully")
    );
  } catch (error) {
    res.status(error.statusCode || 400).json(
      new ApiResponse(error.statusCode || 400, null, error.message || "Error fetching leaves")
    );
  }
});