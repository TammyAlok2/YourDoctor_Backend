import { Router } from "express";
import { getAllNeedHelp } from "../controllers/patientNeed.controllers.js";
import {
  deleteBlog,
  updateBlog,
  createBlog,
  updateUserAvatar,
  updateUserCoverImage,
  allBlogs,
} from "../controllers/blogs.controllers.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/getAllPatientEnquiry", getAllNeedHelp);

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
  .route("blogs/:blogId")
  .patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/blogs/:blogId").patch(upload.single("avatar"), updateUserAvatar);
router.get("/blogs/allBlogs",allBlogs)

export default router;
