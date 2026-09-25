import crypto from "crypto";
import express from "express";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import notificationRoutes from "./routes/notifications.js";
import { getMostPopularCategories } from "./controllers/post.js";
import cors from "cors";
import cookieParser from "cookie-parser";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET must be set in production");
}

const app = express();

const frontendDomain = process.env.FRONTEND_URL || "http://localhost:3000";
const corsOptions = {
	origin: frontendDomain,
	credentials: true,
};

const authAttempts = new Map();
const createRateLimiter = (maxRequests, windowMs) => (req, res, next) => {
	const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
	const now = Date.now();
	const attempts = authAttempts.get(key) || [];
	const recent = attempts.filter((time) => now - time < windowMs);

	if (recent.length >= maxRequests) {
		return res.status(429).json("Too many requests. Please try again later.");
	}

	recent.push(now);
	authAttempts.set(key, recent);
	next();
};

const constantTimeEquals = (first, second) => {
	if (first.length !== second.length) return false;
	try {
		return crypto.timingSafeEqual(Buffer.from(first), Buffer.from(second));
	} catch {
		return false;
	}
};

const csrfProtection = (req, res, next) => {
	if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
		return next();
	}

	if (req.path === "/auth/login" || req.path === "/auth/register") {
		return next();
	}

	const clientToken = req.headers["x-csrf-token"];
	const cookieToken = req.cookies?.csrf_token;

	if (
		!clientToken ||
		!cookieToken ||
		!constantTimeEquals(clientToken, cookieToken)
	) {
		return res.status(403).json("CSRF token missing or invalid");
	}

	next();
};

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Referrer-Policy", "no-referrer");
	res.setHeader(
		"Permissions-Policy",
		"geolocation=(), microphone=(), camera=()",
	);
	next();
});

app.get("/api/csrf-token", (req, res) => {
	const token = crypto.randomBytes(32).toString("hex");
	res.cookie("csrf_token", token, {
		httpOnly: false,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});
	return res.status(200).json({ csrfToken: token });
});

app.use("/api/auth", createRateLimiter(10, 60000), authRoutes);
app.use(csrfProtection);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/api/categories/popular", getMostPopularCategories);

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
