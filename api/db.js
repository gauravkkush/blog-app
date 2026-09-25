import mysql from "mysql2";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDbConfig = () => {
	if (process.env.DATABASE_URL) {
		const url = new URL(process.env.DATABASE_URL);
		return {
			host: url.hostname,
			port: Number(url.port || 3306),
			user: decodeURIComponent(url.username),
			password: decodeURIComponent(url.password),
			database: url.pathname.replace(/^\//, ""),
			ssl: process.env.DB_SSL === "true" ? {} : undefined,
		};
	}

	return {
		host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
		user: process.env.MYSQL_USER || process.env.DB_USER || "root",
		password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
		database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "blogapp",
		port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
		ssl: process.env.DB_SSL === "true" ? {} : undefined,
	};
};

export const db = mysql.createPool({
	...getDbConfig(),
	multipleStatements: true,
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
	queueLimit: 0,
});

db.getConnection((err, connection) => {
	if (err) {
		console.error("Database connection failed:", err.message);
		process.exit(1);
	}
	const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
	connection.query(schema, (schemaError) => {
		connection.release();
		if (schemaError) {
			console.error(
				"Database schema initialization failed:",
				schemaError.message,
			);
			process.exit(1);
		}
		console.log("Connected to database and schema initialized");
	});
});
