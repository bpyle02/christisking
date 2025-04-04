import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { EditorContext } from "../pages/editor.page";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";

const PublishForm = () => {

    let characterLimit = 200;
    let tagLimit = 10;

    let { post_id } = useParams();

    let { post, post: { bannerUrl, title, tags, des, content }, setEditorState, setPost } = useContext(EditorContext);

    let { userAuth: { access_token, username } } = useContext(UserContext);

    let navigate = useNavigate();

    const handleCloseEvent = () => {
        setEditorState("editor")
    }

    const handlePostTitleChange = (e) => {
        let input = e.target;

        setPost({ ...post, title: input.value })
    }

    const handlePostDesChange = (e) => {
        let input = e.target;

        setPost({ ...post, des: input.value })
    }

    const handleTitleKeyDown = (e) => {
        if(e.keyCode == 13) { // enter key
            e.preventDefault();
        }
    }

    const handleKeyDown = (e) => {
        if(e.keyCode == 13 || e.keyCode == 188) {
            e.preventDefault();

            let tag = e.target.value;

            if(tags.length < tagLimit){
                if(!tags.includes(tag) && tag.length){
                    setPost({ ...post, tags: [ ...tags, tag ] })
                }
            } else{
                toast.error(`You can add max ${tagLimit} Tags`)
            }
            
            e.target.value = "";
        }

    }

    const publishPost = (e) => {

        if(e.target.className.includes("disable")) {
            return;
        }

        if(!title.length){
            return toast.error("Write post title before publishing")
        }

        if(!des.length || des.length > characterLimit){
            return toast.error(`Write a description about your post withing ${characterLimit} characters to publish`)
        }

        if(!tags.length){
            return toast.error("Enter at least 1 tag to help us rank your post")
        } 

        let loadingToast = toast.loading("Publishing....");

        e.target.classList.add('disable');

        let postObj = {
            title, bannerUrl, des, content, tags, draft: false
        }

        console.log(username)

        axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/create-post", { ...postObj, id: post_id }, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'username': username
            }
        })
        .then(() => {
            
            e.target.classList.remove('disable');

            toast.dismiss(loadingToast);
            toast.success("Published 👍");

            setTimeout(() => {
                navigate("/dashboard/posts")
            }, 500);

        })
        .catch(( { response } ) => {
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);

            return toast.error(response.data.error)
        })

    }

    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">

                <Toaster />

                <button className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
                onClick={handleCloseEvent}
                >
                    <i className="fi fi-br-cross"></i>
                </button>

                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1">Preview</p>

                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4" >
                        <img src={bannerUrl} />
                    </div>

                    <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">{ title }</h1>

                    <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">{ des }</p>
                </div>

                <div className="border-grey lg:border-1 lg:pl-8">
                    <p className="text-dark-grey mb-2 mt-9">Post Title</p>
                    <input type="text" placeholder="Post Title" defaultValue={title} className="input-box pl-4" onChange={handlePostTitleChange} />

                    <p className="text-dark-grey mb-2 mt-9">Short description about your post</p>

                    <textarea 
                        maxLength={characterLimit}
                        defaultValue={des}
                        className="h-40 resize-none leading-7 input-box pl-4"
                        onChange={handlePostDesChange}
                        onKeyDown={handleTitleKeyDown}
                    >
                    </textarea>

                    <p className="mt-1 text-dark-grey text-sm text-right">{ characterLimit - des.length } characters left</p>
                    
                    <p className="text-dark-grey mb-2 mt-9">Topics - ( Helps is searching and ranking your post post )</p>

                    <div className="relative input-box pl-2 py-2 pb-4">
                        <input type="text" placeholder="Topic" className="sticky input-box bg-white top-0 left-0  pl-4 mb-3 focus:bg-white "
                        onKeyDown={handleKeyDown}
                         />
                        
                        {   
                            tags.map((tag, i) => {
                                return <Tag tag={tag} tagIndex={i} key={i} />
                            }) 
                        }
                    </div>

                    <p className="mt-1 mb-4 text-dark-grey text-right" >{ tagLimit - tags.length } Tags left</p>

                    <button className="btn-dark px-8"
                        onClick={publishPost}
                    >Publish</button>

                </div>

            </section>
        </AnimationWrapper>
    )
}

export default PublishForm;