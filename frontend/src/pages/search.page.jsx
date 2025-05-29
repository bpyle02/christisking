import { useParams } from "react-router-dom";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import PostPostCard from "../components/post-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import axios from "axios";
import { filterPaginationData } from "../common/filter-pagination-data";
import UserCard from "../components/usercard.component";
import { Helmet } from 'react-helmet-async';


const SearchPage = () => {

    let { query } = useParams()

    let [ posts, setPost ] = useState(null);
    let [ users, setUsers ] = useState(null);

    const searchPosts = ({ page = 1, create_new_arr = false }) => {

        axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/search-posts", { query, page })
        .then( async ({ data }) => {

            let formatedData = await filterPaginationData({
                state: posts,
                data: data.posts,
                page,
                countRoute: "/search-posts-count",
                data_to_send: { query },
                create_new_arr
            })

            setPost(formatedData);
        })
        .catch((err) => {
            console.log(err);
        });

    }

    const fetchUsers = () => {
        axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/search-users", { query })
        .then(({ data : { users } } ) => {
            setUsers(users);
        })
    }

    useEffect(() => {

        resetState();
        searchPosts({ page: 1, create_new_arr: true });
        fetchUsers();

    }, [query])

    const resetState = () => {
        setPost(null);
        setUsers(null);
    }

    const UserCardWrapper = () => {
        return (
            <>
                {
                    users == null ? <Loader /> :
                        users.length ? 
                            users.map((user, i) => {
                                return <AnimationWrapper key={i} transition={{ duration: 1, delay: i*0.08 }}>
                                    <UserCard user={user} />
                                </AnimationWrapper>
                            })
                        : <NoDataMessage message="No user found" />
                }
            </>
        )
    }

    return (
        <>
            <Helmet>
                <title>christisking | Search</title>
                <meta name="description" content="Search christisking's library of articles." />
                <meta name="keywords" content="christisking, christ is king, christisking.info, search, articles, article, article search, search page" />
                <meta property="og:title" content="christisking | Search" />
                <meta property="og:description" content="PleaSearch christisking's library of articles." />
                <meta property="og:image" content="https://raw.githubusercontent.com/bpyle02/christisking/refs/heads/main/frontend/src/images/default%20card.png" />
                <meta property="og:url" content="https://christisking.info/search" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            <section className="h-cover flex justify-center gap-10">

                <div className="w-full">
                    <InPageNavigation routes={[`Search Results from "${query}"`, "Accounts Matched"]} defaultHidden={["Accounts Matched"]} >

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
                                <LoadMoreDataBtn state={posts} fetchDataFun={searchPosts} />
                        </>

                        <UserCardWrapper />

                    </InPageNavigation>
                </div>

                <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">

                    <h1 className="font-medium text-xl mb-8">User related to search <i className="fi fi-rr-user mt-1"></i></h1>  

                    <UserCardWrapper />            

                </div>

            </section>
        </>
    )
}

export default SearchPage;