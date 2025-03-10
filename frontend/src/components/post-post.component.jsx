/* eslint-disable react/prop-types */
import { getDay } from "../common/date";
import { Link } from "react-router-dom";
import { useState } from "react";

const PostPostCard = ({ content, author }) => {

    let { publishedAt, tags, title, des, bannerUrl, activity: { total_likes }, post_id: id } = content;
    let { fullname, profile_img, username } = author;

    let [ pageState, setPageState ] = useState("home");

    return ( 
        // <Link to={`/post/${id}`} className="flex gap-8 items-center border-b border-grey pb-5 mb-4">
        //     <div className="w-full">
        //         <div className="flex gap-2 items-center mb-7">
        //             <img src={profile_img} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full" />
        //             <p className="line-clamp-1">{fullname} @{username}</p>
        //             <p className="min-w-fit">{ getDay(publishedAt) }</p>
        //         </div>

        //         <h1 className="post-title">{title}</h1>

        //         <p className="my-3 text-xl font-gelasio leading-7 max-sm:hidden md:max-[1100px]:hidden line-clamp-2">{des}</p>

        //         <div className="flex gap-4 mt-7">
        //             <span className="btn-light py-1 px-4">{tags[0]}</span>
        //             <span className="ml-3 flex items-center gap-2 text-dark-grey">
        //                 <i className="fi fi-rr-heart text-xl"></i>
        //                 { total_likes }
        //             </span>
        //         </div>

        //     </div>
            
        //     <div className="h-28 aspect-sqaure bg-grey">
        //         <img src={bannerUrl} className="w-full h-full aspect-square object-cover" />
        //     </div>

        // </Link>

        <Link to={`/post/${id}`}>
            <div className="mb-8">
                <div className="flex flex-col p-4 md:flex-row border-b border-grey">
                    <div className="md:w-1/2 w-full md:pr-[1rem] md:flex md:items-center">
                            <img
                                className="rounded-xl duration-300 transition-shadow"
                                src={bannerUrl}
                                alt={title}
                                layout="responsive"
                                width={500}
                                height={150}
                            />
                    </div>
                    <div className="md:w-1/2 md:pl-[1rem]">
                        <div className="flex gap-2 items-center mb-7">
                            <img src={profile_img} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
                            <p className="line-clamp-1">{fullname} @{username}</p>
                            <p className="min-w-fit">{ getDay(publishedAt) }</p>
                        </div>
                        <p className="text-4xl font-bold duration-300 transition-colors">{title}</p>
                        <div className="flex gap-3 flex-wrap my-2">
                            <span className="mr-3 flex items-center gap-2 text-dark-grey">
                                <i className="fi fi-rr-heart text-xl"></i>
                                { total_likes }
                            </span>
                            {tags.slice(0, 4).map((tag) => (
                                <p className={"text-sm tag " + (pageState == tag ? " bg-black text-white " : " ")}>
                                    {tag}
                                </p>
                            ))}
                        </div>
                        <p className="text-lg my-4">{des}</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default PostPostCard;