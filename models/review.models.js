import { Schema,model } from "mongoose";

const reviewSchema = new Schema({

    name:{
        type:String,
        required:true,
    },
    rating:{
        type:Number,
        required:true,
    },
    comment:{
        type:String,
    },
    doctorId:{
        type:String,
        required:true,
    },
    userId:{
        type:String,
        required:true,
    }

})

const Review = model('Review', reviewSchema);
export default Review;