import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.page";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import PostPage from "./pages/post.page";
import SideNav from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notifications from "./pages/notifications.page";
import ManagePosts from "./pages/manage-posts.page";
import PrivacyPolicy from "./pages/privacy-policy.page";
import DataDeletion from "./pages/data-deletion.page";
import { HelmetProvider } from 'react-helmet-async';

export const UserContext = createContext({});

export const ThemeContext = createContext({});

const darkThemePreference = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const App = () => {

    const [userAuth, setUserAuth] = useState({});

    const [ theme, setTheme ] = useState(() => darkThemePreference() ? "dark" : "light" );

    useEffect(() => {

        let userInSession = lookInSession("user");
        let themeInSession = lookInSession("theme");

        userInSession ? setUserAuth(JSON.parse(userInSession)) : setUserAuth({ access_token: null })
        
        if (themeInSession) {
            setTheme(() => {

                document.body.setAttribute('data-theme', themeInSession);

                return themeInSession;
            
            })
        } else {
            document.body.setAttribute('data-theme', theme)
        }

    }, [])


    return (
        <HelmetProvider>
            <ThemeContext.Provider value={{ theme, setTheme }}>
                <UserContext.Provider value={{userAuth, setUserAuth}}>
                    <Routes>
                        <Route path="/editor" element={<Editor />} />
                        <Route path="/editor/:post_id" element={<Editor />} />
                        <Route path="/" element={<Navbar />}> 
                            <Route index element={<HomePage />} />
                            <Route path="privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="data-deletion" element={<DataDeletion />} />
                            <Route path="dashboard" element={<SideNav />} > 
                                <Route path="posts" element={<ManagePosts />} />
                                <Route path="notifications" element={<Notifications />} />
                            </Route>
                            <Route path="settings" element={<SideNav />} >  
                                <Route path="edit-profile" element={<EditProfile />} />
                                <Route path="change-password" element={<ChangePassword />} />
                            </Route>
                            <Route path="signin" element={<UserAuthForm type="sign-in" />} /> 
                            <Route path="signup" element={<UserAuthForm type="sign-up" />} />
                            <Route path="search/:query" element={<SearchPage />} />
                            <Route path="user/:id" element={<ProfilePage />} />
                            <Route path="post/:post_id" element={<PostPage />}/>
                            <Route path="*" element={<PageNotFound />} /> 
                        </Route>
                    </Routes>
                </UserContext.Provider>
            </ThemeContext.Provider>
        </HelmetProvider>
    );

}

export default App;