

import {DoctorSchedule, DoctorLeave} from '../models/doctorSchedule.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';

export const updateSchedule = asyncHandler(async (req, res) => {
  try {
    const { scheduleId, slotId, startTime, endTime, maxSlot } = req.body;

    if (!scheduleId || !slotId || !startTime || !endTime || !maxSlot) {
      throw new AppError("Please provide all required fields: scheduleId, slotId, startTime, endTime, and maxSlot", 400);
    }

    const schedule = await DoctorSchedule.findById(scheduleId);
    if (!schedule) {
      throw new AppError("Schedule not found. Please check the scheduleId and try again", 404);
    }

    const slot = schedule.slots.id(slotId);
    if (!slot) {
      throw new AppError("Slot not found in the given schedule. Please check the slotId and try again", 404);
    }

    slot.startTime = startTime;
    slot.endTime = endTime;
    slot.maxSlot = maxSlot;
    await schedule.save();
    res.status(200).json(new ApiResponse(200, schedule, "Schedule updated successfully"));
  } catch (error) {
    throw new AppError(error.message || "An error occurred while updating the schedule. Please try again later", error.statusCode || 500);
  }
});

const isDateInLeave = async (doctorId, date) => {
  try {
    const leave = await DoctorLeave.findOne({
      doctorId,
      startDate: { $lte: date },
      endDate: { $gte: date },
    });
    return !!leave;
  } catch (error) {
    console.error("Error checking leave:", error);
    return false;
  }
};

export const createSchedule = asyncHandler(async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    if (!doctorId) {
      throw new AppError("Doctor not found or not logged in. Please log in and try again", 400);
    }

    const { date, startTime, endTime, availableSlot } = req.body;

    if (!date || !startTime || !endTime || !availableSlot) {
      throw new AppError("Please provide all required fields: date, startTime, endTime, and availableSlot", 400);
    }

    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      throw new AppError("Invalid date format. Please provide the date in a valid format (e.g., YYYY-MM-DD)", 400);
    }

    const currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
if (formattedDate < currentDate) {
  throw new AppError("Cannot create schedule for past dates. Please choose a present or future date", 400);
}

    const isOnLeave = await isDateInLeave(doctorId, formattedDate);
    if (isOnLeave) {
      throw new AppError("Cannot create schedule during leave period. Please choose a different date", 400);
    }

    const existingSchedule = await DoctorSchedule.findOne({ doctorId, date: formattedDate });
    if (existingSchedule) {
      const conflictingSlot = existingSchedule.slots.find((slot) => {
        return (startTime >= slot.startTime && startTime < slot.endTime) ||
               (endTime > slot.startTime && endTime <= slot.endTime) ||
               (startTime <= slot.startTime && endTime >= slot.endTime);
      });

      if (conflictingSlot) {
        throw new AppError("The new slot conflicts with an existing slot. Please choose a different time", 400);
      }

      const newSlot = { startTime, endTime, availableSlot };
      existingSchedule.slots.push(newSlot);
      await existingSchedule.save();

      res.status(201).json(new ApiResponse(200, existingSchedule, "New slot added to existing schedule successfully"));
    } else {
      const schedule = new DoctorSchedule({
        doctorId,
        date: formattedDate,
        slots: [{ startTime, endTime, availableSlot }],
      });
      await schedule.save();

      res.status(201).json(new ApiResponse(200, schedule, "New schedule created successfully"));
    }
  } catch (error) {
    throw new AppError(error.message || "An error occurred while creating the schedule. Please try again later", error.statusCode || 400);
  }
});

export const allSchedule = asyncHandler(async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    if (!doctorId) {
      throw new AppError("Doctor not found or not logged in. Please log in and try again", 400);
    }

    const schedules = await DoctorSchedule.find({ doctorId });

    if (!schedules || schedules.length === 0) {
      throw new AppError("No schedules found for this doctor. Try creating a new schedule", 404);
    }

    const filteredSchedules = await Promise.all(schedules.map(async (schedule) => {
      const isOnLeave = await isDateInLeave(doctorId, schedule.date);
      return isOnLeave ? null : schedule;
    }));

    const validSchedules = filteredSchedules.filter(schedule => schedule !== null);

    res.status(200).json(new ApiResponse(200, validSchedules, "All available schedules fetched successfully"));
  } catch (error) {
    throw new AppError(error.message || "An error occurred while fetching schedules. Please try again later", error.statusCode || 500);
  }
});

export const getScheduleByDate = asyncHandler(async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const {date} = req.params;

    if (!doctorId) {
      throw new AppError("Doctor not found or not logged in. Please log in and try again", 400);
    }

    if (!date) {
      throw new AppError("Please provide a date to fetch the schedule", 400);
    }

    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      throw new AppError("Invalid date format. Please provide the date in a valid format (e.g., YYYY-MM-DD)", 400);
    }

    const leave = await DoctorLeave.findOne({
      doctorId,
      startDate: { $lte: formattedDate },
      endDate: { $gte: formattedDate },
    });
  
    if (leave) {
      return res.status(200).json(
        new ApiResponse(200, null, `The doctor is on leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`)
      );
    }

    const schedule = await DoctorSchedule.findOne({ doctorId, date: formattedDate });
 
    if (schedule) {
      res.status(200).json(new ApiResponse(200, schedule, "Schedule found for the requested date"));
    } else {
      res.status(404).json(new ApiResponse(404, null, "No schedule found for the requested date. Try creating a new schedule"));
    }
  } catch (error) {
    throw new AppError(error.message || "An error occurred while fetching the schedule. Please try again later", error.statusCode || 500);
  }
});