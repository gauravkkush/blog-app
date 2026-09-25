import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const tabs = ["Posts", "Drafts", "Trash"];

const Profile = () => {
	const [profile, setProfile] = useState(null);
	const [activeTab, setActiveTab] = useState("Posts");

	const loadProfile = async () => {
		try {
			const response = await axios.get("/posts/profile");
			setProfile(response.data);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		loadProfile();
	}, []);

	if (!profile)
		return (
			<section className="profile-page">
				<p>Loading your profile…</p>
			</section>
		);

	const items =
		activeTab === "Posts"
			? profile.posts
			: activeTab === "Drafts"
				? profile.drafts
				: profile.trash;
	const restore = async (id) => {
		await axios.put(`/posts/trash/${id}/restore`);
		loadProfile();
	};
	const permanentlyDelete = async (id) => {
		if (!window.confirm("Permanently delete this post? This cannot be undone."))
			return;
		await axios.delete(`/posts/trash/${id}`);
		loadProfile();
	};

	return (
		<section className="profile-page">
			<header className="profile-hero">
				<div className="profile-avatar">
					{profile.user.username.slice(0, 1).toUpperCase()}
				</div>
				<div>
					<p className="eyebrow">WRITER PROFILE</p>
					<h1>{profile.user.username}</h1>
					<p>{profile.user.email}</p>
				</div>
				<Link className="new-story" to="/write">
					Write a story <span>→</span>
				</Link>
			</header>
			<nav className="profile-tabs" aria-label="Profile sections">
				{tabs.map((tab) => (
					<button
						key={tab}
						className={activeTab === tab ? "active" : ""}
						onClick={() => setActiveTab(tab)}
					>
						{tab}
						<span>
							{tab === "Posts"
								? profile.posts.length
								: tab === "Drafts"
									? profile.drafts.length
									: profile.trash.length}
						</span>
					</button>
				))}
			</nav>
			<div className="profile-list">
				{items.length === 0 && (
					<div className="profile-empty">
						<h2>No {activeTab.toLowerCase()} yet.</h2>
						<p>
							{activeTab === "Drafts"
								? "Save an unfinished story as a draft to find it here."
								: activeTab === "Trash"
									? "Deleted stories can be restored here for 30 days."
									: "Your published stories will appear here."}
						</p>
					</div>
				)}
				{items.map((post) => (
					<article
						className={`profile-item ${post.media_id || post.img ? "" : "no-media"}`}
						key={post.id}
					>
						{(post.media_id || post.img) && (
							<img
								src={
									post.media_id
										? `/posts/media/${post.media_id}`
										: `/upload/${post.img}`
								}
								alt=""
							/>
						)}
						<div>
							<span>{post.cat || "Uncategorised"}</span>
							<h2>{post.title}</h2>
							{activeTab === "Trash" && (
								<p>
									{Math.max(0, 30 - post.days_in_trash)} days left to restore
								</p>
							)}
						</div>
						<div className="profile-actions">
							{activeTab === "Posts" && (
								<Link to={`/post/${post.id}`}>View</Link>
							)}
							{activeTab === "Drafts" && (
								<Link to="/write?edit=draft" state={post}>
									Continue editing
								</Link>
							)}
							{activeTab === "Trash" && (
								<>
									<button onClick={() => restore(post.id)}>Restore</button>
									<button
										className="danger"
										onClick={() => permanentlyDelete(post.id)}
									>
										Delete forever
									</button>
								</>
							)}
						</div>
					</article>
				))}
			</div>
		</section>
	);
};

export default Profile;
