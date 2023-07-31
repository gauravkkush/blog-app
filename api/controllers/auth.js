import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
	//check existing user
	const q = "SELECT * FROM users WHERE email=? OR username=?";

	db.query(q, [req.body.email, req.body.username], (err, data) => {
		if (err) return res.json(err);

		// Check if email or username already exists in the database
		if (data.length > 0) {
			const existingEmail = data.some((user) => user.email === req.body.email);
			const existingUsername = data.some(
				(user) => user.username === req.body.username
			);

			if (existingEmail && existingUsername) {
				return res.status(409).json("Email and username already exist");
			} else if (existingEmail) {
				return res.status(409).json("Email already exists");
			} else if (existingUsername) {
				return res.status(409).json("Username already exists");
			}
		}

		//password hashing
		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(req.body.password, salt);

		const q =
			"INSERT INTO users(`username`,`email`,`password`,`img`) VALUES(?)";

		const values = [req.body.username, req.body.email, hash, req.body.img];

		db.query(q, [values], (err, data) => {
			if (err) return res.json(err);

			return res.status(200).json("user has been created");
		});
	});
};

export const login = (req, res) => {
	//check user
	const q = "SELECT * FROM users WHERE username=?";
	db.query(q, [req.body.username], (err, data) => {
		if (err) return res.json(err);
		if (data.length === 0) return res.status(404).json("User not found!");

		//check password
		const isPasswordCorrect = bcrypt.compareSync(
			req.body.password,
			data[0].password
		);
		if (!isPasswordCorrect)
			return res.status(400).json("Wrong username or password!");

		const token = jwt.sign({ id: data[0].id }, "jwtkey");
		const { password, ...other } = data[0];

		res
			.cookie("access_token", token, {
				httpOnly: true,
				secure: false,
				sameSite: "none",
			})
			.status(200)
			.json(other);
	});
};

export const logout = (req, res) => {
	res
		.clearCookie("access_token", {
			sameSite: "none",
			secure: true,
		})
		.status(200)
		.json("Use has been logged out.");
};
