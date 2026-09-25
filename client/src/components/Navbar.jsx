import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../img/logoh.png";
import { AuthContext } from "../context/authContext";
import axios from "axios";
import moment from "moment";

const Navbar = () => {
	const { currentUser, logout } = useContext(AuthContext);
	const [categories, setCategories] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [showNotifications, setShowNotifications] = useState(false);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await axios.get("/categories/popular");
				setCategories(res.data);
			} catch (err) {
				console.error(err);
			}
		};
		fetchCategories();
	}, []);

	useEffect(() => {
		if (!currentUser) {
			setNotifications([]);
			return undefined;
		}
		const fetchNotifications = async () => {
			try {
				const response = await axios.get("/notifications");
				setNotifications(response.data);
			} catch (error) {
				console.error(error);
			}
		};
		fetchNotifications();
		const interval = window.setInterval(fetchNotifications, 30000);
		return () => window.clearInterval(interval);
	}, [currentUser]);

	const openNotifications = async () => {
		setShowNotifications((isOpen) => !isOpen);
		if (notifications.some((notification) => !notification.is_read)) {
			try {
				await axios.put("/notifications/read");
				setNotifications((items) =>
					items.map((item) => ({ ...item, is_read: 1 })),
				);
			} catch (error) {
				console.error(error);
			}
		}
	};

	return (
		<div className="navbar">
			<div className="container">
				<Link className="write-article" to="/write">
					<span aria-hidden="true">+</span> Write article
				</Link>
				<div className="logo">
					<Link to="/">
						<img src={Logo} alt="logo" />
					</Link>
				</div>
				<nav className="nav-topics" aria-label="Topics">
					<Link to="/">Popular</Link>
					<Link to="/?cat=uncategorised">Uncategorised</Link>
					{categories.map((c) => (
						<Link key={c.cat} to={`/?cat=${c.cat}`}>
							{c.cat}
						</Link>
					))}
				</nav>
				<div className="nav-actions">
					<button
						className="nav-icon"
						type="button"
						aria-label="Search posts"
						onClick={() => window.dispatchEvent(new Event("focus-post-search"))}
					>
						⌕
					</button>
					<div className="notification-wrap">
						<button
							className="nav-icon tooltip-icon"
							type="button"
							aria-label="Notifications"
							data-tooltip="Notifications"
							onClick={openNotifications}
						>
							♧
						</button>
						{notifications.some((notification) => !notification.is_read) && (
							<span
								className="notification-badge"
								aria-label="Unread notifications"
							/>
						)}
						{showNotifications && (
							<div className="notification-panel">
								<div className="notification-header">
									<strong>Notifications</strong>
									<span>{notifications.length}</span>
								</div>
								{notifications.length === 0 ? (
									<p className="notification-empty">No notifications yet.</p>
								) : (
									notifications.map((notification) => (
										<Link
											className={`notification-item ${notification.is_read ? "" : "unread"}`}
											to={`/post/${notification.post_id}`}
											key={notification.id}
											onClick={() => setShowNotifications(false)}
										>
											<span className="notification-dot">
												{notification.type === "like" ? "♥" : "•"}
											</span>
											<span>
												<b>{notification.actor_name}</b>{" "}
												{notification.type === "like"
													? "liked"
													: "commented on"}{" "}
												<strong>{notification.post_title}</strong>
												<small>
													{moment(notification.created_at).fromNow()}
												</small>
											</span>
										</Link>
									))
								)}
							</div>
						)}
					</div>
					{currentUser && (
						<Link className="avatar" to="/profile" aria-label="Open profile">
							{currentUser.username.slice(0, 1).toUpperCase()}
						</Link>
					)}
					{currentUser ? (
						<button className="logout-button" type="button" onClick={logout}>
							Logout
						</button>
					) : (
						<Link className="logout-button" to="/login">
							Login
						</Link>
					)}
				</div>
			</div>
		</div>
	);
};

export default Navbar;
