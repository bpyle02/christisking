import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import PostPostCard from "../components/post-post.component";
import MinimalPostPost from "../components/nobanner-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
    let [posts, setPost] = useState(null);
    let [trendingPosts, setTrendingPost] = useState(null);
    let [ pageState, setPageState ] = useState("home");

    let categories = [
        "apologetics",
        "bible study",
        "science",
        "current events",
        "news"
    ];

    const fetchLatestPosts = ({ page = 1 }) => {
        axios
            .post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/latest-posts", { page })
            .then( async ({ data }) => {

                let formatedData = await filterPaginationData({
                    state: posts,
                    data: data.posts,
                    page,
                    countRoute: "/all-latest-posts-count"
                })

                setPost(formatedData);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const fetchPostsByCategory = ({ page = 1 }) => {
        axios
            .post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/search-posts", { tag: pageState, page })
            .then( async ({ data }) => {
                
                let formatedData = await filterPaginationData({
                    state: posts,
                    data: data.posts,
                    page,
                    countRoute: "/search-posts-count",
                    data_to_send: { tag: pageState }
                })

                setPost(formatedData);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const fetchTrendingPosts = () => {
        axios
            .get(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/trending-posts")
            .then(({ data }) => {
                setTrendingPost(data.posts);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const loadPostByCategory = (e) => {
        
        let category = e.target.innerText.toLowerCase(); 

        setPost(null);

        if(pageState == category){
            setPageState("home");
            return;
        }

        setPageState(category);

    }

    useEffect(() => {

        activeTabRef.current.click();

        if(pageState == "home"){
            fetchLatestPosts({ page: 1 });
        } else {
            fetchPostsByCategory({ page: 1 })
        }

        if(!trendingPosts){
            fetchTrendingPosts();
        }

    }, [pageState]);

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                {/* latest posts */}
                <div className="w-full">
                    <InPageNavigation
                        routes={[ pageState , "trending posts"]}
                        defaultHidden={["trending posts"]}
                    >
                        <>
                            {posts == null ? (
                                <Loader />
                            ) : (
                                posts.results.length ? 
                                    posts.results.map((post, i) => {
                                        return (
                                            <AnimationWrapper
                                                transition={{
                                                    duration: 1,
                                                    delay: i * 0.1,
                                                }}
                                                key={i}
                                            >
                                                <PostPostCard
                                                    content={post}
                                                    author={
                                                        post.author.personal_info
                                                    }
                                                />
                                            </AnimationWrapper>
                                        );
                                    })
                                : <NoDataMessage message="No posts published" />
                            )}
                            <LoadMoreDataBtn state={posts} fetchDataFun={( pageState == "home" ? fetchLatestPosts : fetchPostsByCategory )} />
                        </>

                        {trendingPosts == null ? (
                            <Loader />
                        ) : (
                            trendingPosts.length ?
                                trendingPosts.map((post, i) => {
                                    return (
                                        <AnimationWrapper
                                            transition={{
                                                duration: 1,
                                                delay: i * 0.1,
                                            }}
                                            key={i}
                                        >
                                            <MinimalPostPost
                                                post={post}
                                                index={i}
                                            />
                                        </AnimationWrapper>
                                    );
                                })
                            : <NoDataMessage message="No trending posts" />
                        )}
                    </InPageNavigation>
                </div>

                {/* filters and trending posts */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">
                                Stories form all interests
                            </h1>

                            <div className="flex gap-3 flex-wrap">
                                {categories.map((category, i) => {
                                    return (
                                        <button onClick={loadPostByCategory} className={"tag " + (pageState == category ? " bg-black text-white " : " ")} 
                                        key={i}>
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h1 className="font-medium text-xl mb-8">
                                Trending&nbsp;
                                <i className="fi fi-rr-arrow-trend-up"></i>
                            </h1>

                            {trendingPosts == null ? (
                                <Loader />
                            ) : (
                                trendingPosts.length ? 
                                    trendingPosts.map((post, i) => {
                                        return (
                                            <AnimationWrapper
                                                transition={{
                                                    duration: 1,
                                                    delay: i * 0.1,
                                                }}
                                                key={i}
                                            >
                                                <MinimalPostPost
                                                    post={post}
                                                    index={i}
                                                />
                                            </AnimationWrapper>
                                        );
                                    })
                                : <NoDataMessage message="No trending posts" />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default HomePage;
