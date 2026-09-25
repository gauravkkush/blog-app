import React, { useContext, useEffect, useState } from "react";
import Edit from "../img/edit.png";
import Delete from "../img/delete.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Menu from "../components/Menu";
import axios from "axios";
import moment from "moment";
import DOMPurify from "dompurify";
import { AuthContext } from "../context/authContext";

const Single = () => {
	const [post, setPost] = useState({});
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [engagement, setEngagement] = useState({ likesCount: 0, liked: false });
	const [comments, setComments] = useState([]);
	const [commentBody, setCommentBody] = useState("");
	const [commentError, setCommentError] = useState("");
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);

	const location = useLocation();
	const navigate = useNavigate();

	const postId = location.pathname.split("/")[2];
	const { currentUser } = useContext(AuthContext);
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [postResponse, engagementResponse, commentsResponse] =
					await Promise.all([
						axios.get(`/posts/${postId}`),
						axios.get(`/posts/${postId}/engagement`),
						axios.get(`/posts/${postId}/comments`),
					]);
				setPost(postResponse.data);
				setEngagement(engagementResponse.data);
				setComments(commentsResponse.data);
			} catch (err) {
				console.log(err);
			}
		};
		fetchData();
	}, [postId]);

	const handleLike = async () => {
		if (!currentUser) return navigate("/login");
		try {
			const response = await axios.post(`/posts/${postId}/like`);
			setEngagement(response.data);
		} catch (error) {
			console.log(error);
		}
	};

	const handleComment = async (event) => {
		event.preventDefault();
		if (!currentUser) return navigate("/login");
		try {
			setIsSubmittingComment(true);
			setCommentError("");
			const response = await axios.post(`/posts/${postId}/comments`, {
				body: commentBody,
			});
			setComments((previous) => [
				{
					...response.data,
					username: currentUser.username,
					created_at: new Date().toISOString(),
					user_id: currentUser.id,
				},
				...previous,
			]);
			setCommentBody("");
		} catch (error) {
			setCommentError(error.response?.data || "Unable to add comment");
		} finally {
			setIsSubmittingComment(false);
		}
	};

	const handleDeleteComment = async (commentId) => {
		try {
			await axios.delete(`/posts/${postId}/comments/${commentId}`);
			setComments((previous) =>
				previous.filter((comment) => comment.id !== commentId),
			);
		} catch (error) {
			console.log(error);
		}
	};

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await axios.delete(`/posts/${postId}`);
			navigate("/");
		} catch (err) {
			console.log(err);
			setIsDeleting(false);
		}
	};

	return (
		<div className="single">
			<div className="content">
				{post?.media?.length ? (
					post.media.map((media) => (
						<img
							key={media.id}
							src={`/posts/media/${media.id}`}
							alt={media.original_name}
						/>
					))
				) : post?.img ? (
					<img src={`/upload/${post.img}`} alt="" />
				) : null}
				<div className="user">
					{post.userImg && <img src={post.userImg} alt="" />}
					<div className="info">
						<span>{post.username}</span>
						<p>Posted {moment(post.date).fromNow()}</p>
					</div>
					{currentUser?.username === post.username && (
						<div className="edit">
							<Link to={`/write?edit=2`} state={post}>
								<img src={Edit} alt="" />
							</Link>
							<button
								className="icon-button"
								onClick={() => setShowDeleteDialog(true)}
								aria-label="Move post to trash"
							>
								<img src={Delete} alt="" />
							</button>
						</div>
					)}
				</div>
				<h1>{post.title}</h1>
				<div
					className="article-body"
					dangerouslySetInnerHTML={{
						__html: DOMPurify.sanitize(post.desc || ""),
					}}
				/>
				<section className="engagement" aria-label="Post engagement">
					<button
						className={`like-button ${engagement.liked ? "liked" : ""}`}
						type="button"
						onClick={handleLike}
					>
						<span aria-hidden="true">♥</span> {engagement.likesCount}{" "}
						{engagement.likesCount === 1 ? "Like" : "Likes"}
					</button>
					<h2>
						Comments <span>{comments.length}</span>
					</h2>
					<form className="comment-form" onSubmit={handleComment}>
						<textarea
							value={commentBody}
							onChange={(event) => setCommentBody(event.target.value)}
							placeholder={
								currentUser
									? "Share your thoughts"
									: "Log in to join the conversation"
							}
							maxLength={2000}
							disabled={!currentUser}
						/>
						<button
							type="submit"
							disabled={
								!currentUser || isSubmittingComment || !commentBody.trim()
							}
						>
							{isSubmittingComment ? "Posting…" : "Post comment"}
						</button>
					</form>
					{commentError && <p className="comment-error">{commentError}</p>}
					<div className="comment-list">
						{comments.map((comment) => (
							<article className="comment" key={comment.id}>
								<div className="comment-heading">
									<strong>{comment.username}</strong>
									<time>{moment(comment.created_at).fromNow()}</time>
								</div>
								<p>{comment.body}</p>
								{currentUser?.id === comment.user_id && (
									<button
										type="button"
										onClick={() => handleDeleteComment(comment.id)}
									>
										Delete
									</button>
								)}
							</article>
						))}
					</div>
				</section>
			</div>
			<Menu cat={post.cat} />
			{showDeleteDialog && (
				<div
					className="delete-dialog-backdrop"
					role="presentation"
					onMouseDown={() => !isDeleting && setShowDeleteDialog(false)}
				>
					<div
						className="delete-dialog"
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-post-heading"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<p className="eyebrow">MOVE TO TRASH</p>
						<h2 id="delete-post-heading">Delete this story?</h2>
						<p>
							It will be hidden from readers and kept in your Trash for 30 days.
							You can restore it any time before then.
						</p>
						<div className="dialog-actions">
							<button
								className="cancel"
								onClick={() => setShowDeleteDialog(false)}
								disabled={isDeleting}
							>
								Keep post
							</button>
							<button
								className="confirm"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? "Moving…" : "Move to Trash"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Single;
