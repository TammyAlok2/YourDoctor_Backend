import asyncHandler from "./asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";

export const authorizeRoles = (...roles) =>

    asyncHandler(async (req, _res, next) => {
        console.log(roles)
        console.log(req.user)
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError("You do not have permission to view this route", 403)
        );
      }
  
      next();
    });