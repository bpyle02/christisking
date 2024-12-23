import { useState, useContext } from 'react';
import icon from '../images/icon.png';
import { Link, Outlet } from 'react-router-dom';
import { UserContext } from '../App';
import UserNavigationPanel from './user-navigation.component';

const Navbar = () => {

    const [searchVisibile, setSearchVisibile] = useState(false)
    const [navVisible, setNavVisible] = useState(false)
    const { userAuth } = useContext(UserContext);
    const { access_token, profile_img } = userAuth || {};

    const openUserNav = () => {
        setNavVisible(currentVal => !currentVal);
    }

    const handleBlur = () => {
        setTimeout(() => {
            setNavVisible(false)
        }, 200)
    }

    return (
        <nav className='navbar'>
            <Link to='/'>
                <img src={icon} className='flex-none w-20'/>
            </Link>

            <div className={'absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show ' + (searchVisibile ? 'show' : 'hide')}>
                <input
                    className='w-full md:w-auto bg-grey p-4 pl-6 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12'
                    type='text'
                    placeholder='Search'    
                />

                <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
            </div>

            <div className='flex items-center gap-3 md:gap-6 ml-auto'>
                <button
                    className='md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center'
                    onClick={() => setSearchVisibile(currentVal => !currentVal)}
                >
                    <i className="fi fi-rr-search text-2xl mt-2"></i>
                </button>

                <Link to='/editor' className='hidden md:flex gap-2 link'>
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>

                {
                    access_token ?
                        <>
                            <Link to='/dashboard/notification'>
                                <button className='w-12 h-12 rounded-full bg-grey relative hover:bg-black/10'> 
                                    <i className='fi fi-rr-bell text-2xl block mt-2'></i>
                                </button>
                            </Link>
                        
                            <div
                                className='relative'
                                onClick={openUserNav}
                                onBlur={handleBlur}
                            >
                                <button className='w-12 h-12 mt-2'>
                                    <img src={profile_img} className='w-full h-full object-cover rounded-full'></img>
                                </button>

                                {
                                    navVisible ?
                                        <UserNavigationPanel />
                                    : ""
                                }
                            </div>
                        </>
                    :
                        <>
                            <Link to='/signin' className='btn-dark py-2'>
                                Sign In
                            </Link>

                            <Link to='/signup' className='btn-light py-2 hidden md:block'>
                                Sign Up
                            </Link>
                        </>    
                }

            </div>
        </nav>
    )
}

export default Navbar;