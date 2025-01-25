import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import PostInteraction from "../components/post-interaction.component";
import PostPostCard from "../components/post-post.component";
import PostContent from "../components/post-content.component";
import CommentsContainer, { fetchComments } from "../components/comments.component";

export const postStructure = {
    title: '',
    des: '',
    conent: [],
    author: { personal_info: { } },
    bannerUrl: '',
    publishedAt: '',
}

export const PostContext = createContext({ });

const PostPage = () => {

    let { post_id } = useParams()

    const [ post, setPost ] = useState(postStructure);
    const [ similarPosts, setSimilrPosts ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ islikedByUser, setLikedByUser ] = useState(false);
    const [ commentsWrapper, setCommentsWrapper ] = useState(false);
    const [ totalParentCommentsLoaded, setTotalParentCommentsLoaded ] = useState(0);

    let { title, content, bannerUrl, author: { personal_info: { fullname, username: author_username , profile_img } }, publishedAt } = post;

    const fetchPost = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/get-post", { post_id })
        .then(async ({ data: { post } }) => {

            post.comments = await fetchComments({ post_id: post._id, setParentCommentCountFun: setTotalParentCommentsLoaded })
            setPost(post)

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-posts", { tag: post.tags[0], limit: 6, eliminate_post: post_id })
            .then(({ data }) => {

                setSimilrPosts(data.posts);
            })

            setLoading(false);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
        })
    }

    useEffect(() => {

        resetStates();

        fetchPost();

    }, [post_id])

    const resetStates = () => {
        setPost(postStructure);
        setSimilrPosts(null);
        setLoading(true);
        setLikedByUser(false);
        setCommentsWrapper(false);
        setTotalParentCommentsLoaded(0);
    }

    return (
        <AnimationWrapper>
            {
                loading ? <Loader />
                : 
                <PostContext.Provider value={{ post, setPost, islikedByUser, setLikedByUser, commentsWrapper, setCommentsWrapper, totalParentCommentsLoaded, setTotalParentCommentsLoaded }}>

                    <CommentsContainer />

                    <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">

                        <img src={bannerUrl} className="aspect-video" />

                        <div className="mt-12">
                            <h2>{title}</h2>

                            <div className="flex max-sm:flex-col justify-between my-8">
                                <div className="flex gap-5 items-start">
                                    <img src={profile_img} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full" />

                                    <p className="capitalize">
                                        {fullname}
                                        <br />
                                        @
                                        <Link to={`/user/${author_username}`} className="underline">{author_username}</Link>
                                    </p>
                                    
                                </div>
                                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">Published on {getDay(publishedAt)}</p>
                            </div>
                        </div>

                        <PostInteraction />

                        <div className="my-12 font-gelasio post-page-content">
                            {
                                content[0].blocks.map((block, i) => {
                                    return <div key={i} className="my-4 md:my-8">
                                        <PostContent block={block} />
                                    </div>
                                })
                            }
                        </div>

                        <PostInteraction />

                        {
                            similarPosts != null && similarPosts.length ?
                                <>
                                    <h1 className="text-2xl mt-14 mb-10 font-medium">Similar Posts</h1>

                                    {
                                        similarPosts.map((post, i) => {

                                            let { author: { personal_info } } = post;

                                            return <AnimationWrapper key={i} transition={{ duration: 1, delay: i*0.08 }}>
                                                <PostPostCard content={post} author={personal_info} />
                                            </AnimationWrapper>

                                        })
                                    }
                                </>
                            : " "
                        }

                    </div>
                </PostContext.Provider>
            }
        </AnimationWrapper>
    )
}

export default PostPage;