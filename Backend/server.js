const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute");
const config = require("./config/config");
const testRoutes = require("./routes/testRoute");
const issueRoutes = require("./routes/issueRoute");

connectDB();

const PORT = config.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/test",testRoutes);
app.use("/api/issues", issueRoutes);

app.get("/", (req, res) => {
    res.send("Listening to the backend server");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});