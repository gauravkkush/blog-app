import express from "express";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";

const app = express();

// Enable CORS for all routes
const frontendDomain = "http://localhost:3000";
const corsOptions = {
	origin: frontendDomain,
	credentials: true, // Allows cookies to be sent with the request
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

//upload image
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "../client/public/upload");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname);
	},
});

const upload = multer({ storage: storage, limits: 1024 });

app.post("/api/upload", upload.single("file"), function (req, res) {
	const file = req.file;
	res.status(200).json(file.filename);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.listen(8800, () => {
	console.log("Server is Connected...");
});
