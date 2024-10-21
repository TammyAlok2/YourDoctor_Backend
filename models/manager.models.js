import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
const ManagerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
      unique: true,
      minlength: 10,
      maxlength: 15,
      validate: {
        validator: function (v) {
          return /^[0-9]{10,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    password: {
      type: String,
      required: [true, "password is required"],
      unique: true,
      minlength: [8, "password must contain at least 8 characters"],
      maxlength: 12,
      validate: {
        validator: function (v) {
          return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/.test(v);
        },
        message: (props) =>
          `Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.`,
      },
      select: false,
    },
  },
  { timestamps: true }
);

ManagerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export const Manager = mongoose.model("Manager", ManagerSchema);
