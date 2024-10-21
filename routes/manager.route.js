import { Router } from "express";
import {
  createManager,
  updateManager,
  deleteManager,
  createAppointment,
  seeAppointment,
} from "../controllers/manager.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
const router = Router();

//DOCTOR PERMISSIONS
router.post("/:doctorId/createmanager", isLoggedIn, createManager);
router.put("/:doctorId/:managerId", isLoggedIn, updateManager);
router.delete("/:doctorId/:managerId", isLoggedIn, deleteManager);

//MANAGER PERMISSIONS

router.post("/createAppointments", isLoggedIn, createAppointment);
router.get("/seeAppointments", isLoggedIn, seeAppointment);

export default router;
