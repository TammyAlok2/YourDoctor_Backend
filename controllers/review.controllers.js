import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Review from "../models/review.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import AppError from "../utils/AppError.js";

export const addReview = asyncHandler(async (req, res) => {
  // taking data from the body
  const { name, rating, comment } = req.body;

  // taking userId from the req.user
  const userId = req.user.id;

  // taking doctorId from the params
  const { doctorId } = req.params;

  // making new review

  const newReview = await Review.create({
    name,
    rating,
    comment,
    userId,
    doctorId,
  });
  if (!newReview) {
    throw new AppError("failed to create review ", 400);
  }

  res
    .status(201)
    .json(new ApiResponse(200, newReview, "Review Created  successfully"));
});

export const deleteReview = asyncHandler(async (req, res) => {
  // taking reviewId from the params
  const reviewId = req.params;

  const review = await Review.findByIdAndDelete({
    _id: reviewId,
  });

  if (!review) {
    throw new AppError("failed to delete review ", 400);
  }

  res
    .status(201)
    .json(new ApiResponse(200, review, "Review Deleted  successfully"));
});

export const allReview = asyncHandler(async (req, res) => {
  const reviews = await Review.find({});

  res
    .status(201)
    .json(new ApiResponse(200, reviews, "All Review fetched  successfully"));
});

export const reviewForSingleDoctor = asyncHandler(async (req, res) => {
  // finding the doctor by id
  const {doctorId} = req.params;
  const reviews = await Review.find({ doctorId: doctorId });

  if (!doctorId) {
    throw new AppError("Doctor not found for this is ", 400);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        reviews,
        "Review fetched for single doctor "
      )
    );
});
