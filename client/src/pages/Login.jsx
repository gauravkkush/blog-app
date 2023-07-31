import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Logo from "../img/logoh.png";
const Login = () => {
	const [inputs, setInputs] = useState({
		username: "",
		password: "",
	});
	const [err, setError] = useState(null);

	const navigate = useNavigate();

	const { login } = useContext(AuthContext);

	const handleChange = (e) => {
		setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await login(inputs);
			navigate("/");
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
					type="text"
					name="username"
					placeholder="username"
					required
					onChange={handleChange}
				/>
				<input
					type="password"
					name="password"
					placeholder="password"
					required
					onChange={handleChange}
				/>
				<button onClick={handleSubmit}>Login</button>
				{err && <p>{err}</p>}
				<span>
					Don't have an account? <Link to="/register">Register</Link>
				</span>
			</form>
		</div>
	);
};

export default Login;
