import { Schema ,model } from "mongoose";








const appointmentSchema = new Schema(
  {
    doctorId:{
      type:Schema.Types.ObjectId,
      ref:"Doctor"
    },
    patientName: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Removes unnecessary spaces
    },
    patientPhone: {
      type: Number,
      required: true,
      trim: true, // Removes unnecessary spaces
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
    },
    diabetes: {
      type: String,
    },
    bloodPressure: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
    },
  },
  {
    timestamps: true,
  }
);

const Appointment =  model("Appointment", appointmentSchema);
export default Appointment;

