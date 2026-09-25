import express from "express";
import multer from "multer";
import {
	getPost,
	addPost,
	deletePost,
	getPosts,
	updatePost,
	getTrash,
	restorePost,
	permanentlyDeletePost,
	getProfile,
	getMedia,
	getEngagement,
	toggleLike,
	getComments,
	addComment,
	deleteComment,
} from "../controllers/post.js";

const router = express.Router();
const mediaUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 1024 * 1024, files: 10 },
	fileFilter: (req, file, callback) => {
		const allowedMimeTypes = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/gif",
		];

		if (!allowedMimeTypes.includes(file.mimetype)) {
			return callback(
				new Error("Only JPG, PNG, WebP, and GIF images are allowed"),
			);
		}
		callback(null, true);
	},
});

const hasValidImageSignature = (buffer, mimeType) => {
	if (!buffer || buffer.length < 8) return false;

	if (mimeType === "image/png") {
		return (
			buffer[0] === 0x89 &&
			buffer[1] === 0x50 &&
			buffer[2] === 0x4e &&
			buffer[3] === 0x47
		);
	}

	if (mimeType === "image/jpeg") {
		return buffer[0] === 0xff && buffer[1] === 0xd8;
	}

	if (mimeType === "image/gif") {
		return (
			(buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||
			(buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46)
		);
	}

	if (mimeType === "image/webp") {
		return (
			buffer[8] === 0x57 &&
			buffer[9] === 0x45 &&
			buffer[10] === 0x42 &&
			buffer[11] === 0x50
		);
	}

	return false;
};

const parseMedia = (req, res, next) => {
	mediaUpload.array("media", 10)(req, res, (error) => {
		if (error) return res.status(400).json(error.message);

		if (req.files?.length) {
			for (const file of req.files) {
				if (!hasValidImageSignature(file.buffer, file.mimetype)) {
					return res.status(400).json("Uploaded image content is invalid");
				}
			}
		}

		next();
	});
};

router.get("/", getPosts);
router.get("/trash", getTrash);
router.get("/profile", getProfile);
router.get("/media/:mediaId", getMedia);
router.get("/:id/engagement", getEngagement);
router.post("/:id/like", toggleLike);
router.get("/:id/comments", getComments);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.put("/trash/:id/restore", restorePost);
router.delete("/trash/:id", permanentlyDeletePost);
router.get("/:id", getPost);
router.post("/", parseMedia, addPost);
router.delete("/:id", deletePost);
router.put("/:id", parseMedia, updatePost);

export default router;
