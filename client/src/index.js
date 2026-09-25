import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import { AuthContextProvider } from "./context/authContext";

const getCsrfCookie = () =>
	document.cookie
		.split("; ")
		.find((cookie) => cookie.startsWith("csrf_token="))
		?.split("=")[1];

axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
	const method = (config.method || "get").toUpperCase();
	if (["GET", "HEAD", "OPTIONS"].includes(method)) {
		return config;
	}

	const csrfToken = getCsrfCookie();
	if (csrfToken) {
		config.headers = {
			...config.headers,
			"X-CSRF-Token": csrfToken,
		};
	}

	return config;
});

axios.get("/csrf-token").catch(() => undefined);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<AuthContextProvider>
			<App />
		</AuthContextProvider>
	</React.StrictMode>,
);
