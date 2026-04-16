const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swaggerConfig");

const app = express();

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   MongoDB Connection
========================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
};
connectDB();

/* =========================
   Routes
========================= */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/ride", require("./routes/ride.routes"));
app.use("/api/sos", require("./routes/sos.routes"));
app.use("/api/profile", require("./routes/profile.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/rating-review", require("./routes/ratingReview.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/chat", require("./routes/chat.routes"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* =========================
   Health Check
========================= */
app.get("/", (req, res) => {
  res.send("Capzi API is running. 🚀");
});

/* =========================
   404 Handler
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

/* =========================
   Start Server (🔥 FIX สำคัญ)
========================= */
const PORT = process.env.PORT || 5000;

// ✅ ต้องมี 0.0.0.0 เพื่อให้มือถือเรียกได้
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});