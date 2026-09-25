import React, { useState } from "react";
import ReactQuill from "react-quill";
import axios from "axios";
import "react-quill/dist/quill.snow.css";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";

const Write = () => {
	const state = useLocation().state;
	const [value, setValue] = useState(state?.desc || "");
	const [title, setTitle] = useState(state?.title || "");
	const [files, setFiles] = useState([]);
	const [cat, setCat] = useState(state?.cat || "");
	const [tags, setTags] = useState(state?.tags || "");
	const [contentMode, setContentMode] = useState(
		state?.content_mode || "document",
	);

	const navigate = useNavigate();

	const handleClick = async (e, status = "published") => {
		e.preventDefault();
		const formData = new FormData();
		formData.append("title", title);
		formData.append("desc", value);
		formData.append("cat", cat);
		formData.append("tags", tags);
		formData.append("content_mode", contentMode);
		formData.append("status", status);
		if (!state)
			formData.append("date", moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"));
		files.forEach((selectedFile) => formData.append("media", selectedFile));

		try {
			state
				? await axios.put(`/posts/${state.id}`, formData, { timeout: 30000 })
				: await axios.post(`/posts/`, formData, { timeout: 30000 });
			navigate(status === "draft" ? "/profile" : "/");
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<div className="add">
			<div className="content">
				<input
					type="text"
					value={title}
					placeholder="Title"
					onChange={(e) => setTitle(e.target.value)}
				/>

				<div className="editor-mode" role="group" aria-label="Content mode">
					<button
						type="button"
						className={contentMode === "document" ? "active" : ""}
						onClick={() => setContentMode("document")}
					>
						Document
					</button>
					<button
						type="button"
						className={contentMode === "html" ? "active" : ""}
						onClick={() => setContentMode("html")}
					>
						HTML
					</button>
				</div>
				{contentMode === "document" ? (
					<div className="editorContainer">
						<ReactQuill
							className="editor"
							theme="snow"
							value={value}
							onChange={setValue}
						/>
					</div>
				) : (
					<textarea
						className="html-editor"
						value={value}
						onChange={(event) => setValue(event.target.value)}
						spellCheck="false"
						placeholder={
							'<h2>Your heading</h2>\n<p>Write HTML content here...</p>\n<img data-media-index="0" alt="" />'
						}
						aria-label="HTML content"
					/>
				)}
			</div>
			<div className="menu">
				<div className="item">
					<h1>Publish</h1>
					<span>
						<b>Status: </b> Draft
					</span>
					<span>
						<b>Visibility: </b> Public
					</span>
					<input
						style={{ display: "none" }}
						type="file"
						id="file"
						name="file"
						multiple
						accept="image/*"
						onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 10))}
					/>
					<div className="imageInput">
						<label className="file" htmlFor="file">
							<span>Upload up to 10 images</span>
						</label>
						<p className="warning">
							Each image: 1024KB max. {files.length}/10 selected.
						</p>
					</div>
					<div className="buttons">
						<button onClick={(e) => handleClick(e, "draft")}>
							Save as draft
						</button>
						<button onClick={(e) => handleClick(e, "published")}>
							Publish
						</button>
					</div>
				</div>
				<div className="item">
					<h1>Tags</h1>
					<input
						className="tag-input"
						value={tags}
						onChange={(e) => setTags(e.target.value)}
						placeholder="e.g. react, frontend, tutorial"
					/>
					<p className="hint">Separate tags with commas.</p>
				</div>
				<div className="item">
					<h1>Category</h1>
					<div className="cat">
						<input
							type="radio"
							checked={cat === "art"}
							name="cat"
							value="art"
							id="art"
							onChange={(e) => setCat(e.target.value)}
						/>
						<label htmlFor="art">Art</label>
					</div>
					<div className="cat">
						<input
							type="radio"
							checked={cat === "science"}
							name="cat"
							value="science"
							id="science"
							onChange={(e) => setCat(e.target.value)}
						/>
						<label htmlFor="science">Science</label>
					</div>
					<div className="cat">
						<input
							type="radio"
							checked={cat === "technology"}
							name="cat"
							value="technology"
							id="technology"
							onChange={(e) => setCat(e.target.value)}
						/>
						<label htmlFor="technology">Technology</label>
					</div>
					<div className="cat">
						<input
							type="radio"
							checked={cat === "cinema"}
							name="cat"
							value="cinema"
							id="cinema"
							onChange={(e) => setCat(e.target.value)}
						/>
						<label htmlFor="cinema">Cinema</label>
					</div>
					<div className="cat">
						<input
							type="radio"
							checked={cat === "design"}
							name="cat"
							value="design"
							id="design"
							onChange={(e) => setCat(e.target.value)}
						/>
						<label htmlFor="design">Design</label>
					</div>
					<div className="cat">
						<input
							type="radio"
							name="cat"
							value="food"
							id="food"
							onChange={(e) => setCat(e.target.value)}
						/>
						<label htmlFor="food">Food</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Write;
