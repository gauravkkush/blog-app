import { db } from "../db.js";
import jwt from "jsonwebtoken";

export const getPosts = (req, res) => {
	const q = req.query.cat
		? "Select * from posts where cat=?"
		: "Select * from posts";

	db.query(q, [req.query.cat], (err, data) => {
		if (err) return res.status(500).json(err);

		return res.status(200).json(data);
	});
};
export const getPost = (req, res) => {
	const q =
		"Select p.id,`username`,`title`,`desc`,p.img, u.img as userImg,`cat`,`date` from users u Join posts p on u.id=p.uid where p.id=?";

	db.query(q, [req.params.id], (err, data) => {
		if (err) return res.status(500).json(err);

		return res.status(200).json(data[0]);
	});
};

export const addPost = (req, res) => {
	res.json("from controller");
};

//delete the post
export const deletePost = (req, res) => {
	const token = req.cookies.access_token;

	if (!token) return res.status(401).json("Not Authorized user!");

	jwt.verify(token, "jwtkey", (err, data) => {
		if (err) return res.status(403).json("not a valid token");
		const postId = req.params.id;

		const q = "Delete from posts where `id`=? and `uid`=?";
		db.query(q, [postId, userInfo.id], (err, data) => {
			if (err) return res.status(403).json("You can't delete this post");

			return res.status(200).json("post has been deleted");
		});
	});
};
export const updatePost = (req, res) => {
	res.json("from controller");
};
