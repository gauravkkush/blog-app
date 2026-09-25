import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(() => {
		const storedUser = localStorage.getItem("user");
		return storedUser ? JSON.parse(storedUser) : null;
	});

	const login = async (inputs) => {
		const res = await axios.post("/auth/login", inputs, {
			withCredentials: true,
		});
		setCurrentUser(res.data);
	};

	const logout = async () => {
		await axios.post("/auth/logout", {}, { withCredentials: true });
		setCurrentUser(null);
	};

	useEffect(() => {
		localStorage.setItem("user", JSON.stringify(currentUser));
	}, [currentUser]);

	return (
		<AuthContext.Provider value={{ currentUser, logout, login }}>
			{children}
		</AuthContext.Provider>
	);
};
