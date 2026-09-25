import { db } from "../db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const getAuthenticatedUser = (req, res, callback) => {
	const token = req.cookies.access_token;
	if (!token) return res.status(401).json("Not Authorized user!");
	jwt.verify(token, JWT_SECRET, (err, userInfo) => {
		if (err) return res.status(403).json("not a valid token");
		callback(userInfo);
	});
};

export const getNotifications = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const q = `SELECT n.id, n.type, n.is_read, n.created_at, n.post_id,
			a.username AS actor_name, p.title AS post_title
			FROM notifications n
			JOIN users a ON a.id = n.actor_id
			JOIN posts p ON p.id = n.post_id
			WHERE n.recipient_id = ?
			ORDER BY n.created_at DESC LIMIT 30`;
		db.query(q, [userInfo.id], (err, rows) => {
			if (err) return res.status(500).json(err);
			return res.status(200).json(rows);
		});
	});
};

export const markNotificationsRead = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		db.query(
			"UPDATE notifications SET is_read = TRUE WHERE recipient_id = ? AND is_read = FALSE",
			[userInfo.id],
			(err) => {
				if (err) return res.status(500).json(err);
				return res.status(204).end();
			},
		);
	});
};
