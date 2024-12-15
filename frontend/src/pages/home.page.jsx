import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar.component";

const Homepage = () => {

    return (
        <div>
            <Navbar />
            <h1 className="text-3xl font-bold text-center mt-10">Site Under Construction.</h1>
            <Outlet />
        </div>
    )
}

export default Homepage;