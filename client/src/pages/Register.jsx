import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../img/logoh.png";

// Create React App exposes REACT_APP_* variables at build time; dotenv belongs
// only in Node.js code. An empty base keeps local requests compatible with the
// development proxy configured in package.json.
const api = process.env.REACT_APP_API_URL || "";
const Register = () => {
	const [inputs, setInputs] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [err, setError] = useState(null);
	const navigate = useNavigate();

	const handleChange = (e) => {
		setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await axios.post(`${api}/auth/register`, inputs);
			navigate("/login");
		} catch (err) {
			setError(err.response.data);
		}
	};

	return (
		<div className="auth">
			<form>
				<div className="logo">
					<img src={Logo} alt="" />
				</div>
				<input
					type="email"
					placeholder="Email"
					name="email"
					onChange={handleChange}
					required
				/>
				<input
					type="text"
					placeholder="username"
					name="username"
					onChange={handleChange}
					required
				/>
				<input
					type="password"
					placeholder="password"
					name="password"
					onChange={handleChange}
					required
				/>
				<button onClick={handleSubmit}>Register</button>
				{err && <p>{err}</p>}
				<span>
					Do you have an account? <Link to="/login">Login</Link>
				</span>
			</form>
		</div>
	);
};

export default Register;
