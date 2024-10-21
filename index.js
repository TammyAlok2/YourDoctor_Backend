import { v2 } from "cloudinary";
import app from "./app.js";
import connectToDB from "./configs/dbConn.js";

// Cloudinary configuration
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dytu2coay",
  api_key: process.env.CLOUDINARY_API_KEY || 455556969989771,
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "mvZAN3yUiEbzxRqFFpykis-0lpw",
});

// Razorpay configuration

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  // Connect to DB
  await connectToDB();
  console.log(`App is running at http://localhost:${PORT}`);
});
