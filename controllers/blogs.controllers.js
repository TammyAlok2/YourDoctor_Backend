import { asyncHandler } from "../utils/asynchandler.js";
import AppError from "../utils/AppError.js";
import { Blog } from "../models/blog.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//All Blogs
const allBlogs = asyncHandler(async(req,res)=>{
  try {
    const blogs = await Blog.find({});
    if(!blogs){
      throw new AppError(401,"Blogs does not found ")
    }
    return res.status(200).json(
      new ApiResponse(200, blogs, "All blogs successfully")
    )

  } catch (error) {
    throw new AppError(401,"Blogs does not found ")
  }
})

const deleteBlog = asyncHandler(async (req, res) => {
  try {
    const { blogId } = req.params;
    console.log(blogId);
    const user = await Blog.findOneAndDelete({
      _id: blogId,
    });

    // If no blog found
    if (!user) {
      throw new APPError(
        404,
        "Blog not found or you are not authorized to delete it"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Blog deleted successfully"));
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new APPError(500, `Failed to delete the blog: ${error.message}`);
  }
});
// Update blog post
const updateBlog = asyncHandler(async (req, res) => {
  const { name, title, description, category } = req.body;

  if (!name || !title || !description || !category) {
    throw new AppError(400, "All fields are required");
  }

  const { blogId } = req.params;
  console.log("Blog ID:", blogId); // Logging the blogId for debugging purposes

  // Check if the blog exists
  const blogExists = await Blog.findById(blogId);
  if (!blogExists) {
    throw new AppError(404, "Blog not found");
  }

  // Update the blog
  const updatedBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      $set: {
        name,
        title,
        category,
        description,
      },
    },
    { new: true } // This returns the updated document
  );

  if (!updatedBlog) {
    throw new AppError(404, "Failed to update: Blog not found");
  }

  // Send response with the updated blog
  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "Blog updated successfully"));
});
//create new blog
const createBlog = asyncHandler(async (req, res) => {
  const { name, category, title, description } = req.body;
  if (
    [name, category, title, description].some((field) => field?.trim() === "")
  ) {
    throw new AppError(400, "all fields are required");
  }

  const avatarlocalpath = req.files?.avatar?.[0]?.path;
  let coverimagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverimagelocalpath = req.files.coverimage?.[0]?.path;
  }
  if (!avatarlocalpath) {
    throw new AppError(400, "avatar files is required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath);
  // console.log(avatar)
  const coverimage = await uploadOnCloudinary(coverimagelocalpath);
  // console.log(coverimage)

  if (!avatar) {
    throw new AppError(400, "avatar is required");
  }

  const blog = await Blog.create({
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    category,
    title,
    description,
    name: name.toLowerCase(),
  });

  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, blog, "Blog created  successfully"));
});

//update image
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;
  if (!avatarPath) {
    throw new AppError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarPath);

  if (!avatar.url) {
    throw new AppError(400, "Error while uploading on cloudinary");
  }
  const { blogId } = req.params;

  const blogs = await Blog.findByIdAndUpdate(
    {
      _id: blogId,
    },
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, blogs, "Avatar successfulaly updated"));
});

//update cover img
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const converimagepath = req.file?.body;
  if (!converimagepath) {
    throw new AppError(400, "cover image missing ");
  }

  const coverimage = await uploadOnCloudinary(converimagepath);
  if (!coverimage.url) {
    throw new AppError(400, "error while uploading file on cloudinary");
  }
  const blogId = req.params;
  const blogs = await Blog.findById(
    {
      _id: blogId,
    },
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, blogs, "Coverimage updated successfully"));
});

export {
  deleteBlog,
  updateBlog,
  createBlog,
  updateUserAvatar,
  updateUserCoverImage,
  allBlogs
};
