import {DoctorSchedule,DoctorLeave} from '../models/doctorSchedule.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';




export const updateSchedule = async (req, res) => {
  try {
    const { scheduleId, slotId, startTime, endTime, maxSlot } = req.body;
    const schedule = await DoctorSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const slot = schedule.slots.id(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    slot.startTime = startTime;
    slot.endTime = endTime;
    slot.maxSlot = maxSlot;
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating schedule' });
  }
};


let v1 = new Date('13/12/24') 
let v2 = new Date('14/10/24')
console.log( v1>=v2 )


const isDateInLeave = async (doctorId, date) => {
  console.log(typeof(date))
  const leave = await DoctorLeave.findOne({
    doctorId,
    startDate: { $lte: date },
    endDate: { $gte: date },
  });
  console.log(leave)
  return !!leave;
};

export const createSchedule = asyncHandler(async (req, res, next) => {
  const doctorId = req.user.id;

  if (!doctorId) {
    throw new AppError(400, "Doctor not found or logged in");
  }

  const { date, startTime, endTime, availableSlot } = req.body;

  if (!date || !startTime || !endTime || !availableSlot) {
    throw new AppError(400, "All fields are required");
  }
  const formattedDate = new Date(date);

  // Check if the doctor is on leave
  const isOnLeave = await isDateInLeave(doctorId, new Date(date));
  if (isOnLeave) {
    throw new AppError(400, "Cannot create schedule during leave period");
  }

  const existingSchedule = await DoctorSchedule.findOne({ doctorId, date:formattedDate });
  if (existingSchedule) {
    // Check if the new slot conflicts with an existing slot
    const conflictingSlot = existingSchedule.slots.find((slot) => {
      if (startTime >= slot.startTime && startTime < slot.endTime) {
        return true; // start time conflicts with an existing slot
      }
      if (endTime > slot.startTime && endTime <= slot.endTime) {
        return true; // end time conflicts with an existing slot
      }
      if (startTime <= slot.startTime && endTime >= slot.endTime) {
        return true; // new slot encompasses an existing slot
      }
      return false;
    });

    if (conflictingSlot) {
      throw new AppError(400, "Schedule conflicts with an existing slot");
    }

    // Add new slot to existing schedule
    const newSlot = {
      startTime,
      endTime,
      availableSlot,
    };
    existingSchedule.slots.push(newSlot);
    await existingSchedule.save();

    if (!existingSchedule) {
      return next(new AppError("Failed to create schedule", 400));
    }
    res.status(201).json(
      new ApiResponse(200, existingSchedule, "Schedule updated successfully")
    );
  } else {
    // Create new schedule with single slot
    const schedule = new DoctorSchedule({
      doctorId,
     date: formattedDate,
      slots: [
        {
          startTime,
          endTime,
          availableSlot,
        },
      ],
    });
    await schedule.save();
    if (!schedule) {
      return next(new AppError("Failed to create schedule", 400));
    }
    res.status(201).json(
      new ApiResponse(200, schedule, "Schedule created successfully")
    );
  }
});



export const allSchedule = asyncHandler(async (req, res, next) => {
  const doctorId = req.user.id;

  const schedules = await DoctorSchedule.find({ doctorId });

  if (!schedules || schedules.length === 0) {
    throw new AppError( "No schedules found",400);
  }

  // Filter out schedules during leave periods
  const filteredSchedules = await Promise.all(schedules.map(async (schedule) => {
    const isOnLeave = await isDateInLeave(doctorId, schedule.date);
    return isOnLeave ? null : schedule;
  }));

  const validSchedules = filteredSchedules.filter(schedule => schedule !== null);

  res.status(200).json(
    new ApiResponse(200, validSchedules, "All schedules fetched successfully")
  );
});

export const getScheduleByDate = asyncHandler(async (req, res, next) => {
  const doctorId = req.user.id;
  const { date } = req.body;

  if (!doctorId) {
    throw new AppError(400, "Doctor not found or logged in");
  }

  const formattedDate = new Date(date);
console.log(formattedDate)
  // Check if the doctor is on leave on the given date
  const leave = await DoctorLeave.findOne({
    doctorId,
    startDate: { $lte:formattedDate },
    endDate: { $gte: formattedDate },
  });
  
  if (leave) {
    return res.status(200).json(
      new ApiResponse(200, null, `Doctor is on leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`)
    );
  }

  // Find the schedule for the given date
  const schedule = await DoctorSchedule.findOne({ doctorId, date: formattedDate });
 
 

  res.status(200).json(
    new ApiResponse(200, schedule, "Schedule found")
  );
});