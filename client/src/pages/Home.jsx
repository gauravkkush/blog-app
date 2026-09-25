import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
	const [posts, setPosts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const location = useLocation();
	const navigate = useNavigate();
	const params = new URLSearchParams(location.search);
	const search = params.get("search") || "";
	const category = params.get("cat") || "";
	const [query, setQuery] = useState(search);
	const [activeView, setActiveView] = useState("articles");
	const [sortBy, setSortBy] = useState("date");
	const [categoryPopularity, setCategoryPopularity] = useState({});
	const searchInputRef = useRef(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const res = await axios.get(`/posts${location.search}`);
				setPosts(res.data);
			} catch (err) {
				console.log(err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [location.search]);

	useEffect(() => setQuery(search), [search]);

	useEffect(() => {
		const fetchCategoryPopularity = async () => {
			try {
				const response = await axios.get("/categories/popular");
				setCategoryPopularity(
					Object.fromEntries(
						response.data.map((item) => [item.cat, Number(item.count)]),
					),
				);
			} catch (error) {
				console.log(error);
			}
		};
		fetchCategoryPopularity();
	}, []);

	useEffect(() => {
		const focusSearch = () => searchInputRef.current?.focus();
		window.addEventListener("focus-post-search", focusSearch);
		return () => window.removeEventListener("focus-post-search", focusSearch);
	}, []);

	const submitSearch = (event) => {
		event.preventDefault();
		const next = new URLSearchParams();
		if (query.trim()) next.set("search", query.trim());
		if (category) next.set("cat", category);
		navigate(next.toString() ? `/?${next.toString()}` : "/");
	};

	const getText = (html) => {
		const doc = new DOMParser().parseFromString(html, "text/html");
		return doc.body.textContent;
	};

	const tagsFor = (tags) =>
		(tags || "")
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);

	const displayPosts = useMemo(() => {
		const sorted = [...posts];
		const text = (value) => getText(value || "").toLocaleLowerCase();
		const categoryCount = (post) => categoryPopularity[post.cat] || 0;
		if (sortBy === "title")
			sorted.sort((left, right) =>
				text(left.title).localeCompare(text(right.title)),
			);
		if (sortBy === "author")
			sorted.sort((left, right) =>
				(left.username || "").localeCompare(right.username || ""),
			);
		if (sortBy === "category") {
			sorted.sort(
				(left, right) =>
					categoryCount(right) - categoryCount(left) ||
					(left.cat || "").localeCompare(right.cat || ""),
			);
		}
		if (sortBy === "date")
			sorted.sort((left, right) => new Date(right.date) - new Date(left.date));
		if (activeView === "channels" && sortBy === "date")
			sorted.sort((left, right) =>
				(left.cat || "").localeCompare(right.cat || ""),
			);
		if (activeView === "authors" && sortBy === "date")
			sorted.sort((left, right) =>
				(left.username || "").localeCompare(right.username || ""),
			);
		return sorted;
	}, [activeView, categoryPopularity, posts, sortBy]);

	const selectView = (view) => setActiveView(view);

	return (
		<div className="home">
			<div className="home-toolbar">
				<button
					className={`feed-label ${activeView === "popular" ? "active" : ""}`}
					type="button"
					onClick={() => selectView("popular")}
				>
					<span aria-hidden="true">✦</span> Popular
				</button>
				<div className="feed-tabs">
					<button
						className={activeView === "articles" ? "active" : ""}
						type="button"
						onClick={() => selectView("articles")}
					>
						Articles
					</button>
					<button
						className={activeView === "channels" ? "active" : ""}
						type="button"
						onClick={() => selectView("channels")}
					>
						Channels
					</button>
					<button
						className={activeView === "authors" ? "active" : ""}
						type="button"
						onClick={() => selectView("authors")}
					>
						Authors
					</button>
				</div>
				<form className="compact-search" onSubmit={submitSearch}>
					<span aria-hidden="true">⌕</span>
					<input
						ref={searchInputRef}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search"
						aria-label="Search posts"
					/>
				</form>
				<span className="sort-label">
					<label htmlFor="post-sort">Sort by</label>
					<select
						id="post-sort"
						value={sortBy}
						onChange={(event) => setSortBy(event.target.value)}
					>
						<option value="date">Date</option>
						<option value="title">Title</option>
						<option value="author">Author</option>
						<option value="category">Category</option>
					</select>
				</span>
			</div>

			<div className="results-heading">
				<div>
					<p className="eyebrow">
						{search || category ? "SEARCH RESULTS" : "LATEST STORIES"}
					</p>
					<h2>
						{search
							? `Results for “${search}”`
							: category
								? `${category} stories`
								: "Fresh from the community"}
					</h2>
				</div>
				{(search || category) && <Link to="/">Clear search</Link>}
			</div>
			<div className="posts dashboard-posts">
				{isLoading && <p className="empty-state">Finding great reads…</p>}
				{!isLoading && posts.length === 0 && (
					<p className="empty-state">
						No posts found. Try a different title, tag, or writer.
					</p>
				)}
				{displayPosts.map((post, index) => (
					<div
						className={`post ${index === 0 ? "featured-post" : ""} ${post.media_id || post.img ? "" : "no-media"}`}
						key={post.id}
					>
						{(post.media_id || post.img) && (
							<div className="img">
								<img
									src={
										post.media_id
											? `/posts/media/${post.media_id}`
											: `/upload/${post.img}`
									}
									alt=""
								/>
							</div>
						)}
						<div className="content">
							<div className="post-meta">
								<span>{post.cat || "Uncategorised"}</span>
								<span>By {post.username}</span>
							</div>
							<Link className="link" to={`/post/${post.id}`}>
								<h1>{getText(post.title)}</h1>
							</Link>
							<p>{getText(post.desc)}</p>
							<div className="post-footer">
								<div className="tag-list">
									{tagsFor(post.tags)
										.slice(0, 3)
										.map((tag) => (
											<span key={tag}>#{tag}</span>
										))}
								</div>
								<Link className="read-more" to={`/post/${post.id}`}>
									Read story <span>→</span>
								</Link>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default Home;
