import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET =
	process.env.JWT_SECRET ||
	(isProduction
		? (() => {
				throw new Error("JWT_SECRET must be set in production");
		  })()
		: "dev-jwt-secret-change-me");

const normalizeInput = (value) => (typeof value === "string" ? value.trim() : "");

const cookieOptions = {
	httpOnly: true,
	path: "/",
	secure: isProduction,
	sameSite: "lax",
};

const validateRegistrationInput = ({ username, email, password }) => {
	const normalizedUsername = normalizeInput(username);
	const normalizedEmail = normalizeInput(email).toLowerCase();
	const normalizedPassword = normalizeInput(password);

	if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 30) {
		return "Username must be between 3 and 30 characters.";
	}

	if (!/^[a-zA-Z0-9_.-]+$/.test(normalizedUsername)) {
		return "Username can only contain letters, numbers, dots, underscores, and dashes.";
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
		return "Please provide a valid email address.";
	}

	if (normalizedPassword.length < 8) {
		return "Password must be at least 8 characters long.";
	}

	return null;
};

export const register = (req, res) => {
	const username = normalizeInput(req.body.username);
	const email = normalizeInput(req.body.email).toLowerCase();
	const password = normalizeInput(req.body.password);
	const validationError = validateRegistrationInput({ username, email, password });

	if (validationError) {
		return res.status(400).json(validationError);
	}

	const q = "SELECT * FROM users WHERE email=? OR username=?";

	db.query(q, [email, username], (err, data) => {
		if (err) {
			console.error("Register query failed:", err.message);
			return res.status(500).json("Something went wrong, please try again later");
		}

		if (data.length > 0) {
			const existingEmail = data.some((user) => user.email === email);
			const existingUsername = data.some((user) => user.username === username);

			if (existingEmail && existingUsername) {
				return res.status(409).json("Email and username already exist");
			} else if (existingEmail) {
				return res.status(409).json("Email already exists");
			} else if (existingUsername) {
				return res.status(409).json("Username already exists");
			}
		}

		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);
		const insertQuery = "INSERT INTO users(`username`,`email`,`password`,`img`) VALUES(?)";
		const values = [username, email, hash, req.body.img || null];

		db.query(insertQuery, [values], (insertErr) => {
			if (insertErr) {
				console.error("User creation failed:", insertErr.message);
				return res.status(500).json("Something went wrong, please try again later");
			}

			return res.status(201).json("User has been created");
		});
	});
};

export const login = (req, res) => {
	const username = normalizeInput(req.body.username);
	const password = normalizeInput(req.body.password);

	if (!username || !password) {
		return res.status(400).json("Invalid credentials");
	}

	const q = "SELECT * FROM users WHERE username=?";
	db.query(q, [username], (err, data) => {
		if (err) {
			console.error("Login query failed:", err.message);
			return res.status(500).json("Invalid credentials");
		}
		if (data.length === 0)
			return res.status(401).json("Invalid credentials");

		const isPasswordCorrect = bcrypt.compareSync(password, data[0].password);
		if (!isPasswordCorrect)
			return res.status(401).json("Invalid credentials");

		const token = jwt.sign({ id: data[0].id }, JWT_SECRET);
		const { password: ignoredPassword, ...other } = data[0];

		res
			.cookie("access_token", token, cookieOptions)
			.status(200)
			.json(other);
	});
};

export const logout = (req, res) => {
	res
		.clearCookie("access_token", {
			...cookieOptions,
		})
		.status(200)
		.json("User has been logged out.");
};
