import { Link } from "react-router-dom";
import lightFullLogo from "../images/full-logo-light.png";
import darkFullLogo from "../images/full-logo-dark.png";
import { ThemeContext } from "../App";
import { useContext } from "react";

const DataDeletion = () => {

    let { theme } = useContext(ThemeContext);

    return (
        <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">

            <h1 className="text-4xl font-gelasio leading-7">Data Deletion Page Under Construction</h1>
            <p className="text-dark-grey text-xl leading-7 -mt-8">If you would like to delete your user data, please email me at mail@brandonpyle.com. I will be sure to completely remove all your user data from the system as soon as possible.</p>

            <div className="mt-auto">
                <img src={ theme == "light" ? darkFullLogo : lightFullLogo } className="h-8 object-contain block mx-auto select-none" />
                <p className="mt-5 text-dark-grey">Proclaiming Christ is King by providing relevant apologetic and Biblical content to all.</p>
            </div>

        </section>
    )
}

export default DataDeletion;