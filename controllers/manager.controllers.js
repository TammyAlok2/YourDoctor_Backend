import { ApiResponse } from "../utils/ApiResponse.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { Manager } from "../models/manager.models.js";
import Appointment from "../models/appointment.models.js";

// DOCTOR PERMISSIONS

const createManager = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;
  const { doctorId } = req.params;

  if (
    [!name || !email || !mobile || !password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new AppError(400, "all fields are required");
  }

  const createmanger = {
    name,
    email,
    mobile,
    password,
    doctorId,
  };

  const createdmanager = await Manager.create(createmanger);
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdmanager, "manager created  successfully")
    );
});
const updateManager = asyncHandler(async (req, res) => {
  try {
    const { managerId } = req.params;
    const updates = req.body;
    const manager = await Manager.findByIdAndUpdate(managerId, updates, {
      new: true,
    });
    if (!manager) throw new APPError(404, "manager not found");
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Blog deleted successfully"));
  } catch (error) {
    throw new APPError(404, "manager updation failed");
  }
});
const deleteManager = asyncHandler(async (req, res) => {
  try {
    const { managerId } = req.params;
    const manager = await Manager.findByIdAndDelete(managerId);
    if (!manager) throw new APPError(404, "manager not found");
    return res
      .status(200)
      .json(new ApiResponse(200, null, "manager deleted successfully"));
  } catch (error) {
    throw new APPError(404, "manager deletion failed");
  }
});

//MANAGER PERMISSIONS

const createAppointment = asyncHandler(async (req, res) => {
  try {
    const { patientName, time, slotId } = req.body;
    const newAppointment = new Appointment({
      patientName,
      time,
      slotId,
      managerId: req.manager._id,
      doctorId: req.manager.doctorId,
    });
    await newAppointment.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newAppointment,
          "New Appointment created successfully"
        )
      );
  } catch (error) {
    throw new APPError(404, "Appointment creation failed");
  }
});
const seeAppointment = asyncHandler(async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.manager.doctorId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, appointments, "appointments list founded"));
  } catch (error) {
    throw new APPError(404, "appointment list not founded");
  }
});

export {
  createManager,
  updateManager,
  deleteManager,
  createAppointment,
  seeAppointment,
};
