import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import { Toaster } from "react-hot-toast";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import AnimationWrapper from "../common/page-animation";
import { ManageDraftPostPost, ManagePublishedPostCard } from "../components/manage-post-card.component";
import LoadMoreDataBtn from "../components/load-more.component";
import { useSearchParams } from "react-router-dom";

const ManagePosts = () => {
    
    const [ posts, setPosts ] = useState(null);
    const [ drafts, setDrafts ] = useState(null);
    const [ query, setQuery ] = useState("");

    let activeTab = useSearchParams()[0].get("tab");

    let { userAuth: { access_token } } = useContext(UserContext);

    const getPosts = ({ page, draft, deletedDocCount = 0 }) => {

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/user-written-posts", {
            page, draft, query, deletedDocCount 
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(async ({ data }) => {

            let formatedData = await filterPaginationData({
                state: draft ? drafts : posts,
                data: data.posts, 
                page,
                user: access_token,
                countRoute: "/api/user-written-posts-count",
                data_to_send: { draft, query }
            })

            console.log("draft -> " + draft , formatedData)

            if(draft){
                setDrafts(formatedData)
            } else{
                setPosts(formatedData);
            }

        })
        .catch(err => {
            console.log(err);
        }) 

    }

    useEffect(() => {

        if(access_token){
            if(posts == null){
                getPosts({ page: 1, draft: false })
            }
            if(drafts == null){
                getPosts({ page: 1, draft: true })
            }
        }

    }, [access_token, posts, drafts, query])

    const handleSearch = (e) => {
        let searchQuery = e.target.value;

        setQuery(searchQuery);

        if(e.keyCode == 13 && searchQuery.length){
            setPosts(null);
            setDrafts(null);
        }
    }

    const handleChange = (e) => {
        if(!e.target.value.length){
            setQuery("");
            setPosts(null);
            setDrafts(null);
        }
    }
    
    return (
        <>
            <h1 className="max-md:hidden">Manage Posts</h1>

            <Toaster />

            <div className="relative max-md:mt-5 md:mt-8 mb-10">
                <input 
                    type="search"
                    className="w-full bg-grey p-4 pl-12 pr-6 rounded-full placeholder:text-dark-grey"
                    placeholder="Search Posts"
                    onChange={handleChange}
                    onKeyDown={handleSearch}
                />

                <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey "></i>
            </div>

            <InPageNavigation routes={["Published Posts", "Drafts"]} defaultActiveIndex={ activeTab != 'draft' ? 0 : 1 }>

                { // published Posts

                    posts == null ? <Loader /> :
                    posts.results.length ? 

                       <>
                        {
                            posts.results.map((post, i) => {
                                return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>

                                    <ManagePublishedPostCard post={{ ...post, index: i, setStateFunc: setPosts }} />

                                </AnimationWrapper>
                            })
                        }

                        <LoadMoreDataBtn state={posts} fetchDataFun={getPosts} additionalParam={{ draft: false, deletedDocCount: posts.deletedDocCount }} />

                       </>

                    : <NoDataMessage message="No published posts" />

                }


                { // draft Posts

                    drafts == null ? <Loader /> :
                    drafts.results.length ? 

                    <>
                        {
                            drafts.results.map((post, i) => {
                                return <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>

                                    <ManageDraftPostPost post={{ ...post, index: i, setStateFunc: setDrafts }} />

                                </AnimationWrapper>
                            })
                        }

                        <LoadMoreDataBtn state={drafts} fetchDataFun={getPosts} additionalParam={{ draft: true, deletedDocCount: drafts.deletedDocCount }} />
                    </>

                    : <NoDataMessage message="No draft posts" />

                }

            </InPageNavigation>

        </>
    )
}

export default ManagePosts;