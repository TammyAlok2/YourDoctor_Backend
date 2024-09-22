
import { Router } from "express";
import { getAllNeedHelp } from "../controllers/patientNeed.controllers.js";

const router = Router()

router.get('/getAllPatientEnquiry',getAllNeedHelp)

export default router