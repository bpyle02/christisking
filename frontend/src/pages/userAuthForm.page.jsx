import AnimationWrapper from '../common/page-animation';
import InputBox from '../components/input.component';
import googleIcon from '../images/google.png';
import { Link, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { storeInSession } from '../common/session';
import { useContext } from 'react';
import { UserContext } from '../App';
import { authWithGoogle } from '../common/firebase';

const UserAuthForm = ({ type }) => {

    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext)

    const authWithServer = (serverRoute, formData) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
            .then(({ data }) => {
                storeInSession("user", JSON.stringify(data))
                setUserAuth(data)
            })
            .catch(({ response }) => {
                console.log(response);
            })
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        let serverRoute = type == "sign-in" ? "/signin" : "/signup";

        const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
        let form = new FormData(formElement);
        let formData = {};

        for (let [k, v] of form.entries()) {
            formData[k] = v;
        }

        let { firstname, lastname, email_or_username, email, username, password } = formData

        if (firstname) {
            if (firstname.length < 3) {
                return toast.error("First name must be more than 2 characters long")
            }
        }

        if (lastname) {
            if (lastname.length < 3) {
                return toast.error("First name must be more than 2 characters long")
            }
        }

        if (email_or_username) {
            if (email_or_username.length < 3) {
                return toast.error("Username must be more than 2 characters long")
            }
        }

        if (email) {
            if (!EMAIL_REGEX.test(email)) {
                return toast.error("Email is invalid")
            }
        }

        if (username) {
            if (username.length < 3) {
                return toast.error("Username must be more than 2 characters long")
            }
        }

        if (!PASSWORD_REGEX.test(password)) {
            return toast.error("Password must be between 6 and 20 characters, include at least one number, one uppercase letter, and one lowercase letter")
        }

        authWithServer(serverRoute, formData)
    }

    const handleGoogleAuth = (e) => {
        e.preventDefault();

        authWithGoogle()
        .then(user => {
            let serverRoute = "/google-auth"
            let formData = {
                access_token: user.accessToken
            }

            authWithServer(serverRoute, formData)
        })
        .catch((e) => {
            toast.error("There was an error during Google Authentication.")
            return console.log(e)
        })
    }

    return (
        access_token ?
            <Navigate to='/' />
        :
            <AnimationWrapper keyValue={type}>
                <section className='h-cover flex items-center justify-center'>
                    <Toaster />
                    <form id="formElement" className="w-[80%] max-w-[400px]">
                        <h1 className="text-4xl font-gelasio capitalize text-center mb-24">{type == 'sign-in' ? 'Welcome back' : 'Create an account'}</h1>

                        {
                            type != 'sign-in' ?
                                <div>
                                    <div className='flex flex-row gap-4'>
                                        <InputBox name='firstname' type='text' placeholder='First Name' icon='fi-rr-user' />
                                        <InputBox name='lastname' type='text' placeholder='Last Name' icon='fi-rr-user' />
                                    </div>
                                    <InputBox name='email' type='email' placeholder='Email' icon='fi-rr-envelope' />
                                    <InputBox name='username' type='text' placeholder='Username' icon='fi-rr-envelope' />
                                </div>
                                :
                                <InputBox name='email_or_username' type='text' placeholder='Username or Email' icon='fi-rr-envelope' />
                        }

                        <InputBox name='password' type='password' placeholder='Password' icon='fi-rr-lock' />

                        <button
                            className="btn-dark center mt-14"
                            type='submit'
                            onClick={handleSubmit}
                        >
                            {type.replace('-', ' ')}
                        </button>

                        <div className="relative w-fill items-center flex gap-2 my-10 opacity-10 uppercase text-black font-bold">
                            <hr className="w-1/2 border-black" />
                            <p>or</p>
                            <hr className="w-1/2 border-black" />
                        </div>

                        <button
                            className="btn-dark center mt-14 flex items-center gap-4"
                            onClick={handleGoogleAuth}
                        >
                            <img src={googleIcon} className='w-5' />
                            Continue with Google
                        </button>

                        {
                            type == 'sign-in' ?
                                <p className='mt-6 text-dark-grey text-xl text-center'>
                                    Don't have an account?
                                    <Link to='/signup' className='underline text-black text-xl ml-1'>Sign Up</Link>
                                </p>
                                :
                                <p className='mt-6 text-dark-grey text-xl text-center'>
                                    Already have an account?
                                    <Link to='/signin' className='underline text-black text-xl ml-1'>Sign In</Link>
                                </p>
                        }
                    </form>
                </section>
            </AnimationWrapper>
    )
}

export default UserAuthForm;