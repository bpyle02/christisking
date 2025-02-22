import { Link, useNavigate, useParams } from "react-router-dom";
import lightLogo from "../images/logo-light.png";
import darkLogo from "../images/logo-dark.png";
import AnimationWrapper from "../common/page-animation";
import lightBanner from "../images/post banner light.png"
import darkBanner from "../images/post banner dark.png";
import { useContext, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.page";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import axios from "axios";
import { ThemeContext, UserContext } from "../App";

const PostEditor = () => {

    let { post, post: { title, bannerUrl, content, tags, des }, setPost, textEditor, setTextEditor, setEditorState } = useContext(EditorContext)

    let { userAuth: { access_token, username } } = useContext(UserContext)
    let { theme } = useContext(ThemeContext);
    let { post_id } = useParams();

    let navigate = useNavigate();

    // useEffect
    useEffect(() => {
        if(!textEditor.isReady){
            setTextEditor(new EditorJS({
                holderId: "textEditor",
                data: Array.isArray(content) ? content[0] : content,
                tools: tools,
                placeholder: "Start typing here..."
            }))
        }
    }, [])

    const handlebannerUrlUpload = (e) => {
        let img = e.target.files[0];
        const maxSize = 2 * 1024 * 1024;
    
        if (img) {
            let loadingToast = toast.loading("Uploading...");

            if (img.size > maxSize) {
                toast.dismiss()
                return toast.error("File size exceeds 2MB. Please select a smaller image.")
            }
    
            const formData = new FormData();
            formData.append('bannerUrl', img);

            console.log(formData)
    
            axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + '/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${access_token}`
                }
            })
            .then(response => {
                toast.dismiss(loadingToast);
                toast.success("Uploaded 👍");

                setPost({ ...post, bannerUrl: response.data.bannerUrl });
            })
            .catch(error => {
                console.log(error)
                toast.dismiss(loadingToast);
                toast.error(error.response?.data?.error || 'Upload failed');
            });
        }
    };

    const handleTitleKeyDown = (e) => {
        if(e.keyCode == 13) { // enter key
            e.preventDefault();
        }
    }

    const handleTitleChange = (e) => {
        let input = e.target;

        input.style.height = 'auto';
        input.style.height = input.scrollHeight + "px";

        setPost({ ...post, title: input.value })
    }

    const handleError = (e) => {
        let img = e.target;

        img.src = theme == "light" ? lightBanner : darkBanner;
    }

    const handlePublishEvent = () => {
        
        if(!bannerUrl){
            return toast.error("Upload a post bannerUrl to publish it")
        }

        if(!title.length){
            return toast.error("Write post title to publish it")
        }

        if(textEditor.isReady){
            textEditor.save().then(data => {
                if(data.blocks.length){
                    setPost({ ...post, content: data });
                    setEditorState("publish")
                } else{
                    return toast.error("Write something in your post to publish it")
                }
            })
            .catch((err) => {
                console.log(err);
            })
        }

    }

    const handleSaveDraft = (e) => {

        if(e.target.className.includes("disable")) {
            return;
        }

        if(!title.length){
            return toast.error("Write post title before saving it as a draft")
        }

        let loadingToast = toast.loading("Saving Draft....");

        e.target.classList.add('disable');

        if(textEditor.isReady){
            textEditor.save().then(content => {

                let postObj = {
                    title, bannerUrl, des, content, tags, draft: true
                }

                axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/create-post", { ...postObj, id: post_id }, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'username': username
                    }
                })
                .then(() => {
                    
                    e.target.classList.remove('disable');
        
                    toast.dismiss(loadingToast);
                    toast.success("Saved 👍");
        
                    setTimeout(() => {
                        navigate("/dashboard/posts?tab=draft")
                    }, 500);
        
                })
                .catch(( { response } ) => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast);
        
                    return toast.error(response.data.error)
                })

            })
        }
    }

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-14">
                    <img src={ theme == "light" ? darkLogo : lightLogo } />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1 w-full">
                    { title.length ? title : "New Post" }
                </p>

                <div className="flex gap-4 ml-auto">
                    <button className="btn-dark py-2"
                        onClick={handlePublishEvent}
                    >
                        Publish
                    </button>
                    <button className="btn-light py-2"
                        onClick={handleSaveDraft}
                    >
                        Save Draft
                    </button>
                </div>
            </nav>
            <Toaster />
            <AnimationWrapper>
                <section>
                    <div className="mx-auto max-w-[900px] w-full">
                         

                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                            <label htmlFor="uploadbannerUrl">
                                <img 
                                    src={bannerUrl}
                                    className="z-20"
                                    onError={handleError}
                                />
                                <input 
                                    name="bannerUrl"
                                    id="uploadbannerUrl"
                                    type="file"
                                    accept=".png, .jpg, .jpeg"
                                    hidden
                                    onChange={handlebannerUrlUpload}
                                />
                            </label>
                        </div>

                        <textarea
                            defaultValue={title}
                            placeholder="Post Title"
                            className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                        ></textarea>

                        <hr className="w-full opacity-10 my-5" />

                        <div id="textEditor" className="font-gelasio"></div>

                    </div>
                </section>
            </AnimationWrapper>
        </>
    )
}

export default PostEditor;