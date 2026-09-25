import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Trash = () => {
	const [posts, setPosts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	const loadTrash = async () => {
		try {
			setIsLoading(true);
			setError("");
			const response = await axios.get("/posts/trash");
			if (!Array.isArray(response.data)) {
				throw new Error("The Trash endpoint returned an unexpected response.");
			}
			setPosts(response.data);
		} catch (error) {
			console.log(error);
			setPosts([]);
			setError("Unable to load Trash. Restart the API and try again.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadTrash();
	}, []);

	const restore = async (id) => {
		await axios.put(`/posts/trash/${id}/restore`);
		loadTrash();
	};

	const permanentlyDelete = async (id) => {
		if (!window.confirm("Permanently delete this post? This cannot be undone."))
			return;
		await axios.delete(`/posts/trash/${id}`);
		loadTrash();
	};

	return (
		<section className="trash-page">
			<p className="eyebrow">YOUR LIBRARY</p>
			<h1>Trash</h1>
			<p className="intro">
				Deleted posts stay here for 30 days, then can no longer be restored.
			</p>
			{isLoading && <p>Loading your Trash…</p>}
			{!isLoading && posts.length === 0 && (
				<div className="empty-trash">
					<h2>Your Trash is empty.</h2>
					<Link to="/">Back to stories</Link>
				</div>
			)}
			<div className="trash-list">
				{posts.map((post) => {
					const daysLeft = Math.max(0, 30 - post.days_in_trash);
					return (
						<article
							key={post.id}
							className={`trash-item ${post.img ? "" : "no-media"}`}
						>
							{post.img && <img src={`/upload/${post.img}`} alt="" />}
							<div>
								<span>{post.cat || "Uncategorised"}</span>
								<h2>{post.title}</h2>
								<p>
									{daysLeft} day{daysLeft === 1 ? "" : "s"} left to restore
								</p>
							</div>
							<div className="trash-actions">
								<button onClick={() => restore(post.id)}>Restore</button>
								<button
									className="permanent"
									onClick={() => permanentlyDelete(post.id)}
								>
									Delete forever
								</button>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
};

export default Trash;
