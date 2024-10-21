import { Router } from "express";
import { getAllNeedHelp } from "../controllers/patientNeed.controllers.js";
import {
  changePassword,
  forgotPassword,
  getAppointmentsByDoctor,
  getLoggedInAdminDetails,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  resetPassword,
  updateAdminProfile,
} from "../controllers/admin.controllers.js";
import {
  deleteBlog,
  updateBlog,
  createBlog,
  updateUserAvatar,
  updateUserCoverImage,
  allBlogs,
} from "../controllers/blogs.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";
import { authorizeRoles } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

// Patient enquiry routes
router.get("/getAllPatientEnquiry", getAllNeedHelp);

// Admin routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/getAdminDetails", isLoggedIn, getLoggedInAdminDetails);
router.post("/forget", forgotPassword);
router.post("/reset/:resetToken", resetPassword);
router.put("/update-admin", updateAdminProfile);
router.post("/change-password", isLoggedIn, changePassword);
router.get("/getAppointments/:doctorId", isLoggedIn, authorizeRoles("Admin"), getAppointmentsByDoctor);

// Blog routes
router.route("/blogs/addBlog").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 5,
    },
    {
      name: "coverimage",
      maxCount: 5,
    },
  ]),
  createBlog
);
router.route("/blogs/:blogId").put(updateBlog);
router.route("/blogs/:blogId").delete(deleteBlog);
router
  .route("/blogs/:blogId")
  .patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/blogs/:blogId").patch(upload.single("avatar"), updateUserAvatar);
router.get("/blogs/allBlogs", allBlogs);

export default router;
