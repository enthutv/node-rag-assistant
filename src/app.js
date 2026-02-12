import express from "express";
import cors from "cors";
import testRoute from "./routes/test.js";
import chatRoute from "./routes/chat.js";
import uploadRoute from "./routes/upload.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", uploadRoute);
app.use("/api", testRoute);
app.use("/api", chatRoute);
app.get("/health", (req, res) => {
  res.json({ status: "AI Assistant Running" });
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});