import { DoctorSchedule,DoctorLeave } from "../models/doctorSchedule.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";

export const createLeave = asyncHandler(async (req, res) => {
    const doctorId = req.user.id;
    console.log(doctorId)
    try {
       
      const {  startDate, endDate, reason } = req.body;
      if( !startDate || !endDate){
        throw new AppError("All fields are required ",400)
      }
      
      const newLeave = new DoctorLeave({
        doctorId,
        startDate,
        endDate,
        reason
      });
  
      await newLeave.save();
  
      // Remove any existing schedules within the leave period
      await DoctorSchedule.deleteMany({
        doctorId,
        date: { $gte: startDate, $lte: endDate }
      });
  res.status(200).json(
     new ApiResponse(200,newLeave,"Leave created Successfully")
  )
     
    } catch (error) {
     throw new AppError(error,400)
    }
  });

  export const deleteLeave = asyncHandler(async (req, res, next) => {
    const { leaveId } = req.params;
    const doctorId = req.user.id;
  
    const leave = await DoctorLeave.findOne({ _id: leaveId, doctorId });
  
    if (!leave) {
      throw new AppError(404, "Leave not found or you don't have permission to delete it");
    }
  
    await DoctorLeave.findByIdAndDelete(leaveId);
  
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