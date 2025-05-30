import { useContext, useState } from "react";
import { UserContext } from "../App";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { PostContext } from "../pages/post.page";

const CommentField = ({ action, index = undefined, replyingTo = undefined, setReplying }) => {

    let { post, post: { _id, author: { _id: post_author }, comments, comments: { results: commentsArr }, activity, activity: { total_comments, total_parent_comments } }, setPost, setTotalParentCommentsLoaded } = useContext(PostContext);

    let { userAuth: { access_token, username, fullname, profile_img } } = useContext(UserContext);

    const [ comment, setComment ] = useState("");

    const handleComment = () => {

        if(!access_token){
            return toast.error("login first to leave a comment");
        }

        if(!comment.length){
            return toast.error("Write something to leave a comment....")
        }

        axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + "/add-comment", {
            _id, post_author, comment, replying_to: replyingTo
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(({ data }) => {
            
            setComment("");

            data.commented_by = { personal_info: { username, profile_img, fullname } }

            let newCommentArr;

            if(replyingTo){
                
                commentsArr[index].children.push(data._id);

                data.childrenLevel = commentsArr[index].childrenLevel + 1;
                data.parentIndex = index;

                commentsArr[index].isReplyLoaded = true;

                commentsArr.splice(index + 1, 0, data);

                newCommentArr = commentsArr

                setReplying(false);

            } else{

                data.childrenLevel = 0;

                newCommentArr = [ data, ...commentsArr ];

            }

            let parentCommentIncrementval = replyingTo ? 0 : 1;

            setPost({ ...post, comments: { ...comments, results: newCommentArr }, activity: { ...activity, total_comments: total_comments + 1, total_parent_comments: total_parent_comments + parentCommentIncrementval } })   
            
            setTotalParentCommentsLoaded(preVal => preVal + parentCommentIncrementval)

        })
        .catch(err => {
            console.log(err);
        })

    }

    return (
        <>
            <Toaster />
            <textarea value={comment} 
            onChange={(e) => setComment(e.target.value)}     
            placeholder="Leave a comment..." className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}
            >{action}</button>
        </>
    )
}

export default CommentField;