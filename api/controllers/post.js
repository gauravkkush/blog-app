import { db } from "../db.js";
import jwt from "jsonwebtoken";
import sanitizeHtml from "sanitize-html";

const JWT_SECRET = process.env.JWT_SECRET;

const sanitizeContent = (content) =>
	sanitizeHtml(content || "", {
		allowedTags: [
			"b",
			"br",
			"blockquote",
			"code",
			"em",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"hr",
			"i",
			"img",
			"li",
			"ol",
			"p",
			"pre",
			"s",
			"strong",
			"u",
			"ul",
			"a",
			"span",
		],
		allowedAttributes: {
			a: ["href", "target", "rel"],
			img: ["src", "alt", "title", "width", "height", "data-media-index"],
		},
		allowedSchemes: ["http", "https", "mailto", "tel"],
		allowedSchemesByTag: {
			img: ["http", "https", "data"],
		},
		transformTags: {
			a: sanitizeHtml.simpleTransform(
				"a",
				{ rel: "noopener noreferrer nofollow", target: "_blank" },
				true,
			),
		},
		allowedStyles: {},
		allowedClasses: {},
		allowProtocolRelative: false,
	});

const resolveMediaPlaceholders = (content, mediaIds) =>
	content.replace(/data-media-index=["'](\d+)["']/g, (match, index) =>
		mediaIds[index] ? `src="/posts/media/${mediaIds[index]}"` : "",
	);

const getAuthenticatedUser = (req, res, callback) => {
	const token = req.cookies.access_token;
	if (!token) return res.status(401).json("Not Authorized user!");

	jwt.verify(token, JWT_SECRET, (err, userInfo) => {
		if (err) return res.status(403).json("not a valid token");
		callback(userInfo);
	});
};

//GET All posts
export const getPosts = (req, res) => {
	const category = req.query.cat || req.query.category;
	const search = req.query.search?.trim();
	const filters = ["p.deleted_at IS NULL", "p.status = 'published'"];
	const values = [];

	if (category) {
		if (category.toLowerCase() === "uncategorised") {
			filters.push("COALESCE(TRIM(p.cat), '') = ''");
		} else {
			filters.push("p.cat = ?");
			values.push(category);
		}
	}

	if (search) {
		filters.push(
			"(p.title LIKE ? OR p.tags LIKE ? OR p.cat LIKE ? OR u.username LIKE ?)",
		);
		const term = `%${search}%`;
		values.push(term, term, term, term);
	}

	const q = `SELECT p.*, u.username,
		(SELECT pm.id FROM post_media pm WHERE pm.post_id = p.id ORDER BY pm.position LIMIT 1) AS media_id
		FROM posts p
		JOIN users u ON u.id = p.uid
		WHERE ${filters.join(" AND ")}
		ORDER BY p.date DESC`;

	db.query(q, values, (err, data) => {
		if (err) return res.status(500).json(err);

		return res.status(200).json(data);
	});
};

// get a particular post based on ID
export const getPost = (req, res) => {
	const q =
		"SELECT p.id, username, title, `desc`, content_mode, p.img, u.img AS userImg, cat, tags, `date` FROM users u JOIN posts p ON u.id = p.uid WHERE p.id = ? AND p.deleted_at IS NULL AND p.status = 'published'";

	db.query(q, [req.params.id], (err, data) => {
		if (err) return res.status(500).json(err);
		if (!data[0]) return res.status(404).json("Post not found");
		db.query(
			"SELECT id, original_name, mime_type FROM post_media WHERE post_id = ? ORDER BY position",
			[req.params.id],
			(mediaError, media) => {
				if (mediaError) return res.status(500).json(mediaError);
				return res.status(200).json({ ...data[0], media });
			},
		);
	});
};

export const getMostPopularCategories = (req, res) => {
	const q = `
      SELECT cat, COUNT(*) as count
      FROM posts
		  WHERE deleted_at IS NULL AND status = 'published' AND cat IS NOT NULL AND TRIM(cat) <> ''
      GROUP BY cat
      ORDER BY count DESC
      LIMIT 5
    `;

	db.query(q, (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		return res.status(200).json(rows);
	});
};

// add a new post
export const addPost = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const q =
			"INSERT INTO posts(`title`, `desc`, `img`, `cat`, `tags`, `date`, `status`, `content_mode`, `uid`) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)";
		const values = [
			req.body.title,
			sanitizeContent(req.body.desc),
			req.body.cat,
			req.body.tags || null,
			req.body.date,
			req.body.status === "draft" ? "draft" : "published",
			req.body.content_mode === "html" ? "html" : "document",
			userInfo.id,
		];

		db.query(q, values, (err, data) => {
			if (err) return res.status(500).json(err);
			insertMedia(data.insertId, req.files, (mediaError, mediaIds) => {
				if (mediaError) return res.status(500).json(mediaError);
				const content =
					req.body.content_mode === "html"
						? resolveMediaPlaceholders(values[1], mediaIds)
						: values[1];
				if (content === values[1])
					return res.status(200).json("Post has been created");
				db.query(
					"UPDATE posts SET `desc` = ? WHERE id = ?",
					[content, data.insertId],
					(contentError) => {
						if (contentError) return res.status(500).json(contentError);
						return res.status(200).json("Post has been created");
					},
				);
			});
		});
	});
};

//delete the post
export const deletePost = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const postId = req.params.id;
		const q =
			"UPDATE posts SET deleted_at = NOW() WHERE id = ? AND uid = ? AND deleted_at IS NULL";
		db.query(q, [postId, userInfo.id], (err, data) => {
			if (err || data.affectedRows === 0)
				return res.status(403).json("You can't delete this post");

			return res.status(200).json("Post moved to trash");
		});
	});
};

//edit old post
export const updatePost = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const postId = req.params.id;
		const q =
			"UPDATE posts SET `title`=?, `desc`=?, `cat`=?, `tags`=?, status=?, content_mode=? WHERE `id`=? AND `uid`=? AND deleted_at IS NULL";
		const values = [
			req.body.title,
			sanitizeContent(req.body.desc),
			req.body.cat,
			req.body.tags || null,
			req.body.status === "draft" ? "draft" : "published",
			req.body.content_mode === "html" ? "html" : "document",
		];

		db.query(q, [...values, postId, userInfo.id], (err, data) => {
			if (err) return res.status(500).json(err);
			if (!req.files?.length)
				return res.status(200).json("Post has been updated");
			db.query(
				"DELETE FROM post_media WHERE post_id = ?",
				[postId],
				(deleteError) => {
					if (deleteError) return res.status(500).json(deleteError);
					insertMedia(postId, req.files, (mediaError, mediaIds) => {
						if (mediaError) return res.status(500).json(mediaError);
						const content =
							req.body.content_mode === "html"
								? resolveMediaPlaceholders(values[1], mediaIds)
								: values[1];
						if (content === values[1])
							return res.status(200).json("Post has been updated");
						db.query(
							"UPDATE posts SET `desc` = ? WHERE id = ?",
							[content, postId],
							(contentError) => {
								if (contentError) return res.status(500).json(contentError);
								return res.status(200).json("Post has been updated");
							},
						);
					});
				},
			);
		});
	});
};

const insertMedia = (postId, files = [], callback) => {
	if (!files.length) return callback(null, []);
	const values = files.map((file, position) => [
		postId,
		file.originalname,
		file.mimetype,
		file.size,
		file.buffer,
		position,
	]);
	db.query(
		"INSERT INTO post_media (post_id, original_name, mime_type, file_size, data, position) VALUES ?",
		[values],
		(err, result) =>
			callback(
				err,
				err ? [] : files.map((file, index) => result.insertId + index),
			),
	);
};

export const getMedia = (req, res) => {
	db.query(
		"SELECT mime_type, data FROM post_media WHERE id = ?",
		[req.params.mediaId],
		(err, rows) => {
			if (err) return res.status(500).json(err);
			if (!rows[0]) return res.status(404).end();
			res.set("Content-Type", rows[0].mime_type);
			return res.send(rows[0].data);
		},
	);
};

export const getEngagement = (req, res) => {
	const postId = req.params.id;
	const userId = getOptionalUserId(req);
	db.query(
		"SELECT COUNT(*) AS likesCount FROM post_likes WHERE post_id = ?",
		[postId],
		(countError, countRows) => {
			if (countError) return res.status(500).json(countError);
			if (!userId)
				return res
					.status(200)
					.json({ likesCount: countRows[0].likesCount, liked: false });
			db.query(
				"SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?",
				[postId, userId],
				(likeError, likeRows) => {
					if (likeError) return res.status(500).json(likeError);
					return res.status(200).json({
						likesCount: countRows[0].likesCount,
						liked: likeRows.length > 0,
					});
				},
			);
		},
	);
};

export const toggleLike = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const findLike =
			"SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?";
		db.query(findLike, [req.params.id, userInfo.id], (findError, rows) => {
			if (findError) return res.status(500).json(findError);
			const query = rows.length
				? "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?"
				: "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)";
			db.query(query, [req.params.id, userInfo.id], (toggleError) => {
				if (toggleError) return res.status(500).json(toggleError);
				if (!rows.length) {
					notifyPostOwner(
						req.params.id,
						userInfo.id,
						"like",
						null,
						(notificationError) => {
							if (notificationError)
								return res.status(500).json(notificationError);
							returnLikeCount(req, res, true);
						},
					);
					return;
				}
				returnLikeCount(req, res, false);
			});
		});
	});
};

const returnLikeCount = (req, res, liked) => {
	db.query(
		"SELECT COUNT(*) AS likesCount FROM post_likes WHERE post_id = ?",
		[req.params.id],
		(countError, countRows) => {
			if (countError) return res.status(500).json(countError);
			return res.status(200).json({
				liked,
				likesCount: countRows[0].likesCount,
			});
		},
	);
};

export const getComments = (req, res) => {
	const q = `SELECT c.id, c.body, c.created_at, c.user_id, u.username
		FROM post_comments c JOIN users u ON u.id = c.user_id
		WHERE c.post_id = ? ORDER BY c.created_at DESC`;
	db.query(q, [req.params.id], (err, rows) => {
		if (err) return res.status(500).json(err);
		return res.status(200).json(rows);
	});
};

export const addComment = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const body = req.body.body?.trim();
		if (!body) return res.status(400).json("Comment cannot be empty");
		if (body.length > 2000) return res.status(400).json("Comment is too long");
		db.query(
			"INSERT INTO post_comments (post_id, user_id, body) VALUES (?, ?, ?)",
			[req.params.id, userInfo.id, body],
			(err, result) => {
				if (err) return res.status(500).json(err);
				notifyPostOwner(
					req.params.id,
					userInfo.id,
					"comment",
					result.insertId,
					(notificationError) => {
						if (notificationError)
							return res.status(500).json(notificationError);
						return res.status(201).json({ id: result.insertId, body });
					},
				);
			},
		);
	});
};

export const deleteComment = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		db.query(
			"DELETE FROM post_comments WHERE id = ? AND post_id = ? AND user_id = ?",
			[req.params.commentId, req.params.id, userInfo.id],
			(err, result) => {
				if (err) return res.status(500).json(err);
				if (!result.affectedRows)
					return res.status(404).json("Comment not found");
				return res.status(204).end();
			},
		);
	});
};

const getOptionalUserId = (req) => {
	const token = req.cookies.access_token;
	if (!token) return null;
	try {
		return jwt.verify(token, JWT_SECRET).id;
	} catch {
		return null;
	}
};

const notifyPostOwner = (postId, actorId, type, commentId, callback) => {
	db.query(
		"SELECT uid FROM posts WHERE id = ? AND deleted_at IS NULL",
		[postId],
		(postError, posts) => {
			if (postError) return callback(postError);
			if (!posts[0] || posts[0].uid === actorId) return callback(null);
			db.query(
				"INSERT INTO notifications (recipient_id, actor_id, post_id, comment_id, type) VALUES (?, ?, ?, ?, ?)",
				[posts[0].uid, actorId, postId, commentId, type],
				callback,
			);
		},
	);
};

export const getTrash = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const q = `SELECT id, title, img, cat, tags, deleted_at,
			TIMESTAMPDIFF(DAY, deleted_at, NOW()) AS days_in_trash
			FROM posts
			WHERE uid = ? AND deleted_at IS NOT NULL
			AND deleted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
			ORDER BY deleted_at DESC`;

		db.query(q, [userInfo.id], (err, data) => {
			if (err) return res.status(500).json(err);
			return res.status(200).json(data);
		});
	});
};

export const restorePost = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const q = `UPDATE posts SET deleted_at = NULL
			WHERE id = ? AND uid = ? AND deleted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
		db.query(q, [req.params.id, userInfo.id], (err, data) => {
			if (err || data.affectedRows === 0)
				return res.status(404).json("Post is no longer available to restore");
			return res.status(200).json("Post restored");
		});
	});
};

export const permanentlyDeletePost = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const q =
			"DELETE FROM posts WHERE id = ? AND uid = ? AND deleted_at IS NOT NULL";
		db.query(q, [req.params.id, userInfo.id], (err, data) => {
			if (err || data.affectedRows === 0)
				return res.status(404).json("Post not found in trash");
			return res.status(200).json("Post permanently deleted");
		});
	});
};

export const getProfile = (req, res) => {
	getAuthenticatedUser(req, res, (userInfo) => {
		const userQuery = "SELECT id, username, email, img FROM users WHERE id = ?";
		const postsQuery = `SELECT id, title, img, cat, tags, date,
			(SELECT pm.id FROM post_media pm WHERE pm.post_id = posts.id ORDER BY pm.position LIMIT 1) AS media_id FROM posts
			WHERE uid = ? AND deleted_at IS NULL AND status = ? ORDER BY date DESC`;
		const trashQuery = `SELECT id, title, img, cat, tags, deleted_at,
			TIMESTAMPDIFF(DAY, deleted_at, NOW()) AS days_in_trash FROM posts
			WHERE uid = ? AND deleted_at IS NOT NULL AND deleted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
			ORDER BY deleted_at DESC`;

		db.query(userQuery, [userInfo.id], (userError, users) => {
			if (userError || !users[0])
				return res.status(500).json("Unable to load profile");
			db.query(postsQuery, [userInfo.id, "published"], (postsError, posts) => {
				if (postsError) return res.status(500).json(postsError);
				db.query(postsQuery, [userInfo.id, "draft"], (draftError, drafts) => {
					if (draftError) return res.status(500).json(draftError);
					db.query(trashQuery, [userInfo.id], (trashError, trash) => {
						if (trashError) return res.status(500).json(trashError);
						return res
							.status(200)
							.json({ user: users[0], posts, drafts, trash });
					});
				});
			});
		});
	});
};
