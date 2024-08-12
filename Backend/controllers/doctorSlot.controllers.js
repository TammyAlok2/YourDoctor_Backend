import DoctorSchedule from '../models/doctorSchedule.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';

export const createSchedule = asyncHandler(async (req, res, next) => {
    const doctorId = req.user.id;
  
    if (!doctorId) {
      throw new AppError("Doctor not found or logged in");
    }
    const { date, startTime, endTime, availableSlot } = req.body;
  
    if (!date || !startTime || !endTime || !availableSlot) {
      throw new AppError(400, "All fields are required");
    }
  
    const existingSchedule = await DoctorSchedule.findOne({ doctorId, date });
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
        patients: [],
      };
      existingSchedule.slots.push(newSlot);
      await existingSchedule.save();
  
      if (!existingSchedule) {
        return next(new AppError("Failed to create schedule", 400));
      }
      res.status(201).json(
        new ApiResponse(200, existingSchedule, "Scheduled Created successfully")
      );
    } else {
      // Create new schedule with single slot
      const schedule = new DoctorSchedule({
        doctorId,
        date,
        slots: [
          {
            startTime,
            endTime,
            availableSlot,
            patients: [],
          },
        ],
         // Initialize slotSize to 1
      });
      await schedule.save();
      if (!schedule) {
        return next(new AppError("Failed to create schedule", 400));
      }
      res.status(201).json(
        new ApiResponse(200, schedule, "Scheduled Created successfully")
      );
    }
  });

export const getScheduleForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const doctorId = req.user.id;
    const schedule = await DoctorSchedule.findOne({ doctorId, date });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

   
      res.status(201).json(
        new ApiResponse(200,schedule ,"Scheduled fetched  successfully ")
      )
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting schedule' });
  }
};

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

export const allSchedule = asyncHandler(async (req,res,next)=>{
  const doctorId = req.user.id

  const schedule = await  DoctorSchedule.find({doctorId});

  if(!schedule){
    throw new AppError(500,"Scheduled not found ")
  }

  res.status(201).json(
    new ApiResponse(200, schedule, "All scheduled fetched ")
  );

})
