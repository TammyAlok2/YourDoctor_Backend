import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import { patientNeed } from "../models/needHelp.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import AppError from "../utils/AppError.js";

export const registerNeedHelp = asyncHandler(async(req,res)=>{


    const {name,number} = req.body;
    console.log(name,number)
    if(!name || !number){
        throw new AppError("Name and number required",400)
    }
    const date = Date.now()
    console.log(date)

    const enquiry = await patientNeed.create({
        name,number,date
    })

    res.status(201).json(
        new ApiResponse(200,enquiry,"Enquiry send successfully")
    )

})

export const getAllNeedHelp = asyncHandler(async(req,res)=>{


    const enquiry = await patientNeed.find({});
 
    res.status(201).json(
        new ApiResponse(200,"Enquiry fetched successfully",enquiry)
    )

})