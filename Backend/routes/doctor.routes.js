import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getAllDoctors,
  getLoggedInUserDetails,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUser,
  getAppointments,
  newAppointmentByDoctor,
  activeStatus,
  updateAppointmentByDoctor,
  updateDoctorFees,
  tokenCheck,
} from "../controllers/doctor.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middleware.js";
import {
  allSchedule,
  createSchedule,
  getScheduleByDate,
  updateSchedule,
} from "../controllers/doctorSlot.controllers.js";
import { createLeave } from "../controllers/doctorLeave.controllers.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", isLoggedIn, getLoggedInUserDetails);
router.post("/reset", forgotPassword);
router.post("/reset/:resetToken", resetPassword);
router.post("/reset/token-check/:resetToken",tokenCheck)
router.post("/change-password", isLoggedIn, changePassword);
router.put("/update-profile", isLoggedIn, upload.single("avatar"), updateUser);
router.get("/myAppointments", isLoggedIn, getAppointments);

router.post("/newAppointmentByDoctor", isLoggedIn, newAppointmentByDoctor);
router.post(
  "/updateAppointmentByDoctor/:appointmentId",
  isLoggedIn,
  updateAppointmentByDoctor
);
router.get("/allDoctors", getAllDoctors);
router.post("/createSchedule", isLoggedIn, createSchedule);
router.post("updateSchedule", isLoggedIn, updateSchedule);

router.get("/allSchedule", isLoggedIn, allSchedule);
router.get('/getScheduleByDate',isLoggedIn,getScheduleByDate)
router.post("/doctor-status", isLoggedIn, activeStatus);
router.post("/update-fees", isLoggedIn,updateDoctorFees);

router.post("/createLeave",isLoggedIn,createLeave)

export default router;
