
import { Router } from "express";
import { getAllNeedHelp } from "../controllers/patientNeed.controllers.js";
import { changePassword, forgotPassword, getAppointmentsByDoctor, getLoggedInAdminDetails, loginAdmin, logoutAdmin, registerAdmin, resetPassword, updateAdminProfile } from "../controllers/admin.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
import { authorizeRoles } from "../middlewares/admin.middleware.js";

const router = Router()

router.get('/getAllPatientEnquiry',getAllNeedHelp)
router.get('/getAppointments/:doctorId',isLoggedIn,authorizeRoles("Admin"),getAppointmentsByDoctor)

router.post('/register',registerAdmin)
router.post('/login',loginAdmin)
router.post('/logout',logoutAdmin)
router.get('/getAdminDetails',isLoggedIn,getLoggedInAdminDetails)
router.post('/forget',forgotPassword)
router.post('/reset/:resetToken',resetPassword)
router.put('/update-admin',updateAdminProfile)
router.post('/change-password',isLoggedIn,changePassword)

export default router