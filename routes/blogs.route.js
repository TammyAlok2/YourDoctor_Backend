import { Router } from "express";
import {
  deleteBlog,
  updateBlog,
  createBlog,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/blogs.controllers.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/addblog").post(
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
router.route("/:blogId").put(updateBlog);
router.route("/:blogId").delete(deleteBlog);
router
  .route("/:blogId")
  .patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/:blogId").patch(upload.single("avatar"), updateUserAvatar);

export default router;
