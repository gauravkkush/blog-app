import { createBrowserRouter, RouterProvider, Outlet } from
"react-router-dom";
import Register from "./pages/Register"
import Login from "./pages/Login"
import Single from "./pages/Single"
import Write from "./pages/Write"
import Home from "./pages/Home"
import Trash from "./pages/Trash";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./style.scss";


const Layout =() =>{
  return (
    <>
    <Navbar/>
      <Outlet/>
      <Footer/>
    </>
  );
};

const router = createBrowserRouter([
  {
    path:"/",
    element: <Layout/>, 
      children:[
        {
          path:"/",
          element: <Home/>
        },
        {
        path:"/post/:id",
        element: <Single/>
        },
        {
        path:"/write",
        element: (
          <ProtectedRoute>
            <Write />
          </ProtectedRoute>
        )
        },
        {
          path:"/trash",
          element: (
            <ProtectedRoute>
              <Trash />
            </ProtectedRoute>
          )
        },
        {
          path:"/profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )
        }
      ]
   
  },
  {
    path:"/register",
    element: <Register/>
  },
  {
    path:"/login",
    element: <Login/>
  }
  
])

function App() {
  return (
    <div className="app">
      <div className="container"> 
        <RouterProvider router={router}/> 
      </div>
    </div>
  );
}



export default App;
