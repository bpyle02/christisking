/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { getDay } from "../common/date";

const MinimalPostPost = ({ post, index }) => {
    
    let { title, post_id: id, author: { personal_info: { fullname, username, profile_img } }, publishedAt } = post;

    return (
        <Link to={`/post/${id}`} className="flex gap-5 mb-8">
            <h1 className="post-index">{ index < 10 ? "0" + (index + 1) : index}</h1>

            <div>
                <div className="flex gap-2 items-center mb-7">
                    <img src={profile_img} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full" />
                    <p className="line-clamp-1">{fullname} @{username}</p>
                    <p className="min-w-fit">{ getDay(publishedAt) }</p>
                </div>

                <h1 className="post-title">{title}</h1>
            </div>
        </Link>
    )
}

export default MinimalPostPost;