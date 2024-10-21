import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getLoggedInUserDetails,
  loginUser,
  logoutUser,
  newAppointment,
  registerUser,
  resetPassword,
  updateUser,
  getScheduleByDatePatient,
  allAppointmentByUser,
  deletePatient,
} from "../controllers/patient.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middleware.js";
import { registerNeedHelp } from "../controllers/patientNeed.controllers.js";
import { addReview, allReview } from "../controllers/review.controllers.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", isLoggedIn, getLoggedInUserDetails);
router.post("/reset", forgotPassword);
router.post("/reset/:resetToken", resetPassword);
router.post("/change-password", isLoggedIn, changePassword);
router.put("/update/:id", isLoggedIn, upload.single("avatar"), updateUser);
router.post("/newAppointment/:doctorId",isLoggedIn,newAppointment)
router.get("/allScheduleByDate/:doctorId/:date",isLoggedIn,getScheduleByDatePatient)
router.post('/postEnquiry',registerNeedHelp)
router.delete('/delete',isLoggedIn,deletePatient)

router.get('/allAppointments',isLoggedIn,allAppointmentByUser)

router.post('/addReview/:doctorId',isLoggedIn,addReview)
router.get('/allReviews',allReview)

export default router;
