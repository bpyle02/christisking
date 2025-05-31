/* eslint-disable react/prop-types */
import { getDay } from "../common/date";
import { Link } from "react-router-dom";
import { useState } from "react";

const PostPostCard = ({ content, author }) => {

    let { publishedAt, tags, title, des, bannerUrl, activity: { total_likes }, post_id: id } = content;
    let { fullname, profile_img, username } = author;

    let [ pageState, setPageState ] = useState("home");

    return ( 

        <Link to={`/post/${id}`}>
            <div className="mb-8">
                <div className="flex flex-col p-4 md:flex-row border-b border-grey">
                    <div className="md:w-1/2 w-full md:pr-[1rem] md:flex md:items-center">
                            <img
                                className="rounded-xl w-full h-auto object-cover"
                                src={bannerUrl}
                                alt={title}
                            />
                    </div>
                    <div className="md:w-1/2 md:pl-[1rem]">
                        <div className="flex gap-2 items-center my-4">
                            <img src={profile_img} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
                            <p className="line-clamp-1">{fullname} @{username}</p>
                            <p className="min-w-fit">
                                {String(new Date(publishedAt).toLocaleDateString(
                                "en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                }
                                ))}
                            </p>
                        </div>
                        <p className="text-4xl font-bold">{title}</p>
                        <div className="flex gap-3 flex-wrap my-2">
                            <span className="mr-3 flex items-center gap-2 text-dark-grey">
                                <i className="fi fi-rr-heart text-xl"></i>
                                { total_likes }
                            </span>
                            {tags.slice(0, 4).map((tag, index) => (
                                <p
                                    key={`${tag}-${index}`}
                                    className={"text-sm tag " + (pageState == tag ? " bg-black text-white " : " ")}
                                >
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