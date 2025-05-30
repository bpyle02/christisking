import { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import googleIcon from "../images/google.png";
import facebookIcon from "../images/facebook.png";
import { Link, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
import { authWithFacebook } from "../common/firebase";
import { Helmet } from 'react-helmet-async';

console.log(import.meta.env.VITE_NODE_SERVER_DOMAIN)

const UserAuthForm = ({ type }) => {

    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext)

    const userAuthThroughServer = (serverRoute, formData) => {

        axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + serverRoute, formData)
        .then(({ data }) => {
            storeInSession("user", JSON.stringify(data))
            
            setUserAuth(data)
        })
        .catch(({ response }) => {
            toast.error(response.data.error)
        })

    }

    const handleSubmit = (e) => {

        e.preventDefault();

        let serverRoute = type == "sign-in" ? "/signin" : "/users";

        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

        // formData
        let form = new FormData(formElement);
        let formData = {};

        for(let [key, value] of form.entries()){
            formData[key] = value;
        }

        let { fullname, email, password } = formData;

        // form validation

        if(fullname){
            if(fullname.length < 3){
                return toast.error("Fullname must be at least 3 letters long")
           }
        }
       if(!email.length){
            return toast.error("Enter Email" )
       }
       if(!emailRegex.test(email)){
            return toast.error("Email is invalid" )
       }
       if(!passwordRegex.test(password)){
            return toast.error("Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters")
       }

       userAuthThroughServer(serverRoute, formData)

    }

    const handleGoogleAuth = (e) => {

        e.preventDefault();

        authWithGoogle().then(user => {
            
            let serverRoute = "/google-auth";

            let formData = {
                access_token: user.accessToken
            }

            userAuthThroughServer(serverRoute, formData)

        })
        .catch(err => {
            toast.error('trouble login through google');
            return console.log(err)
        })

    }

    const handleFacebookAuth = (e) => {

        e.preventDefault();

        authWithFacebook().then(user => {
            
            let serverRoute = "/facebook-auth";

            let formData = {
                access_token: user.accessToken
            }

            userAuthThroughServer(serverRoute, formData)

        })
        .catch(err => {
            toast.error('trouble login through facebook');
            return console.log(err)
        })

    }

    return (
        access_token ?
        <Navigate to="/" />
        :
        <>
            <Helmet>
                <title>christisking | Auth</title>
                <meta name="description" content="Please sign in or sign up using one of the available options." />
                <meta name="keywords" content="auth, oauth, authentication, google, facebook, email, sign up, sign in, signup, signin, christisking, christ is king, christisking.info" />
                <meta property="og:title" content="christisking | Auth" />
                <meta property="og:description" content="Please sign in or sign up using one of the available options." />
                <meta property="og:image" content="https://raw.githubusercontent.com/bpyle02/christisking/refs/heads/main/frontend/src/images/default%20card.png" />
                <meta property="og:url" content="https://christisking.info/signin" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <AnimationWrapper keyValue={type}>
                <section className="h-cover flex items-center justify-center">
                    <Toaster />
                    <form id="formElement" className="w-[80%] max-w-[400px]">
                        <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                            {type == "sign-in" ? "Welcome back" : "Join us today" }
                        </h1>

                        {
                            type != "sign-in" ?
                            <InputBox
                            name="fullname"
                            type="text"
                            placeholder="Full Name"
                            icon="fi-rr-user"
                            />
                            : ""
                        }

                        <InputBox
                            name="email"
                            type="email"
                            placeholder="Email"
                            icon="fi-rr-envelope"
                            />

                        <InputBox
                            name="password"
                            type="password"
                            placeholder="Password"
                            icon="fi-rr-key"
                            />

                        <button
                            className="btn-dark center mt-14"
                            type="submit"
                            onClick={handleSubmit}
                            >   
                            { type.replace("-", " ") }
                        </button>

                        <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                            <hr className="w-1/2 border-black" />
                            <p>or</p>
                            <hr className="w-1/2 border-black" />
                        </div>

                        <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth} >
                            <img src={googleIcon} className="w-5" />
                            continue with google
                        </button>

                        <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center mt-2" onClick={handleFacebookAuth}>
                            <img src={facebookIcon} className="w-5" />
                            continue with facebook
                        </button>

                        {
                            
                            type == "sign-in" ?
                            <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have an account ?
                            <Link to="/users" className="underline text-black text-xl ml-1" >
                                Sign up here.
                            </Link>  
                            </p>
                            :
                            <p className="mt-6 text-dark-grey text-xl text-center">
                            Already hav an accouont?
                            <Link to="/signin" className="underline text-black text-xl ml-1" >
                                Sign in here.
                            </Link>  
                            </p>

    }

                    </form>
                </section>
            </AnimationWrapper>
        </>
    )
}

export default UserAuthForm;