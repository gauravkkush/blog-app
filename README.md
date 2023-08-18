# My Blog App

![Project Demo](demo.gif)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Introduction

My Blog App is a web application that allows users to read, write, and publish blog posts on various topics. Users can register and log in to create and manage their blog posts. The app also provides a user-friendly text editor to compose blog content with ease.

## Features

- User Authentication: Users can create an account, log in, and log out securely.
- Create and Edit Blog Posts: Users can write and edit their blog posts using a rich text editor.
- Categorization: Blog posts can be categorized into different topics (e.g., Art, Science, Technology, Cinema, Design, Food).
- Image Upload: Users can upload images to use in their blog posts.
- Publish and Drafts: Users can save blog posts as drafts or publish them for public visibility.
- Responsive Design: The app is fully responsive and works well on various devices.

## Technologies Used

- Frontend: React, React Quill (text editor), Axios
- Backend: Node.js, Express.js, MongoDB
- Authentication: JWT (JSON Web Tokens)
- File Upload: Multer
- Other: Moment.js, CORS, Cookie Parser

## Installation

1. Clone the repository:

```
git clone https://github.com/gauravkkush/blog-app.git
cd blog-app
```

2. Install frontend and backend dependencies:

```
cd client
npm install
cd ../server
npm install
```

3. Set up the environment variables:

Create a `.env` file in the `server` directory and set the following variables:

```
PORT=8800
SECRET_KEY=your-secret-key-for-jwt
```

4. Run the application:

```
cd client
npm start
cd ../server
npm start
```

## Usage

1. Open the app in your web browser by navigating to `http://localhost:3000`.

2. If you are a new user, click on "Register" to create an account. If you already have an account, click on "Login."

3. Once logged in, you will be redirected to the dashboard where you can create new blog posts, view your drafts, or publish existing posts.

4. To create a new blog post, click on "New Post," enter the title, select the category, and start writing your content using the provided text editor. You can also upload images to include in your post.

5. After writing the post, you can either save it as a draft or click on "Publish" to make it visible to the public.

6. To edit an existing post, click on the "Edit" button next to the respective post on the dashboard.

7. To log out, click on your username in the navigation bar and select "Logout."

## API Endpoints

The backend server provides the following API endpoints:

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in an existing user.
- `GET /api/auth/logout`: Log out the currently logged-in user.
- `POST /api/upload`: Upload an image file.
- `POST /api/posts/`: Create a new blog post.
- `GET /api/posts/`: Get all published blog posts.
- `GET /api/posts/:id`: Get a specific blog post by ID.
- `PUT /api/posts/:id`: Update an existing blog post by ID.

## Contributing

Contributions to this project are welcome! If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute the code for personal and commercial projects. 
