const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swaggerConfig");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection (Async พร้อมจัดการ error)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1); // ปิดเซิร์ฟเวอร์ถ้าเชื่อม MongoDB ไม่สำเร็จ
  }
};
connectDB();

// ✅ API Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/ride", require("./routes/ride.routes"));
app.use("/api/sos", require("./routes/sos.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/profile", require("./routes/profile.routes")); // ✅ โปรไฟล์และ KYC
app.use("/api/payment", require("./routes/payment.routes")); // ✅ ระบบ wallet หรือ QR
app.use("/api/rating-review", require("./routes/ratingReview.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Fallback route (optional)
app.get("/", (req, res) => {
  res.send("Capzi API is running.");
});

// ✅ 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

