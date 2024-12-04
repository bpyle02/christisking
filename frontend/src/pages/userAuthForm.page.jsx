import AnimationWrapper from '../common/page-animation';
import InputBox from '../components/input.component';
import googleIcon from '../images/google.png';
import { Link } from 'react-router-dom';

const UserAuthForm = ({ type }) => {
    return (
        <AnimationWrapper keyValue={type}>
            <section className='h-cover flex items-center justify-center'>
                <form className="w-[80%] max-w-[400px]">
                    <h1 className="text-4xl font-gelasio capitalize text-center mb-24">{type == 'sign-in' ? 'Welcome back' : 'Create an account'}</h1>

                    {
                        type != 'sign-in' ?
                            <InputBox name='fullname' type='text' placeholder='Full Name' icon='fi-rr-user'/>
                            :
                            ''
                    }

                    <InputBox name='email' type='email' placeholder='Email' icon='fi-rr-envelope'/>
                    <InputBox name='password' type='password' placeholder='Password' icon='fi-rr-lock'/>

                    <button
                        className="btn-dark center mt-14"
                        type='submit'
                    >
                        {type.replace('-', ' ')}
                    </button>

                    <div className="relative w-fill items-center flex gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black" />
                        <p>or</p>
                        <hr className="w-1/2 border-black" />
                    </div>

                    <button className="btn-dark center mt-14 flex items-center gap-4">
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