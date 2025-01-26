import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from "firebase-admin";
import serviceAccountKey from "./etc/secrets/firebase_private_key.json" with { type: "json" }
import { getAuth } from "firebase-admin/auth";
import multer from "multer";
import { GridFSBucket } from 'mongodb';
import path from 'path';
import User from './Schema/User.js';
import Post from './Schema/Post.js';
import Uploads from './Schema/Uploads.js';
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";

const server = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
let PORT = 3173;

server.use(express.json());
server.use(cors(
    {
        origin: '*',
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        preflightContinue: false,
    }
))

mongoose.connect((process.env.DB_LOCATION), {
    autoIndex: true
})

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token == null){
        return res.status(401).json({ error: "No access token" })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if(err) {
            return res.status(403).json({ error: "Access token is invalid" })
        }

        req.user = user.id
        req.admin = user.admin
        next()
    })

}

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id, admin: user.admin }, process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
        isAdmin: user.admin
    }
}

const generateUsername = async (email) => {
    let username = email.split("@")[0];

    let isUsernameNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result)

    isUsernameNotUnique ? username += nanoid().substring(0, 5) : "";

    return username;

}

server.post("/signup", (req, res) => {

    let { fullname, email, password } = req.body;
    let isAdmin = false;

    if (process.env.ADMIN_EMAILS.split(",").includes(email)) {
        isAdmin = true;
    }

   // validating the data from frontend
   if (fullname.length < 3){
        return res.status(403).json({ "error": "Fullname must be at least 3 letters long" })
   }
   if (!email.length){
        return res.status(403).json({ "error": "Enter Email" })
   }
   if (!emailRegex.test(email)){
        return res.status(403).json({ "error": "Email is invalid" })
   }
   if (!passwordRegex.test(password)){
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
   }

   bcrypt.hash(password, 10, async (err, hashed_password) => {

        let username = await generateUsername(email);

        let user = new User({
            personal_info: { fullname, email, password: hashed_password, username },
            admin: isAdmin,
            google_auth: false,
            facebook_auth: false
        })

        user.save().then((u) => {

            return res.status(200).json(formatDatatoSend(u))

        })
        .catch(err => {

            if(err.code == 11000) {
                return res.status(500).json({ "error": "Email already exists" })
            }

            return res.status(500).json({ "error": err.message })
        })

   }) 

})

server.post("/signin", (req, res) => {

    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
    .then((user) => {
        if(!user){
            return res.status(403).json({ "error": "Email not found" });
        }
        

        if(!user.google_auth || !user.facebook_auth){

            bcrypt.compare(password, user.personal_info.password, (err, result) => {

                if(err) {
                    return res.status(403).json({ "error": "Error occured while login please try again" });
                }
    
                if(!result){
                    return res.status(403).json({ "error": "Incorrect password" })
                } else{
                    return res.status(200).json(formatDatatoSend(user))
                }
    
            })

        } else {
            return res.status(403).json({ "error": "Account was created using an oauth provider. Try logging in with with Facebook or Google." })
        }

    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ "error": err.message })
    })

})

server.post("/google-auth", async (req, res) => {

    let { access_token } = req.body;

    getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {

        let { email, name, picture } = decodedUser;
        let isAdmin = false;
        
        if (process.env.ADMIN_EMAILS.split(",").includes(email)) {
            isAdmin = true;
        }

        picture = picture.replace("s96-c", "s384-c");

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.username personal_info.profile_img admin google_auth facebook_auth").then((u) => {
            return u || null
        })
        .catch(err => {
            return res.status(500).json({ "error": err.message })
        })

        if(user) { // login
            if(!user.google_auth){
                return res.status(403).json({ "error": "This email was signed up without google. Please log in with password to access the account" })
            }
        }
        else { // sign up
            
            let username = await generateUsername(email);

            user = new User({
                personal_info: { fullname: name, email, username },
                admin: isAdmin,
                google_auth: true,
                facebook_auth: false
            })

            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({ "error": err.message })
            })

        }

        return res.status(200).json(formatDatatoSend(user))

    })
    .catch(err => {
        return res.status(500).json({ "error": "Failed to authenticate you with google. Try with some other google account" })
    })

})

server.post("/facebook-auth", async (req, res) => {

    let { access_token } = req.body;
    
    
    getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
        
        let { email, name } = decodedUser;
        let isAdmin = false;
        
        if (process.env.ADMIN_EMAILS.split(",").includes(email)) {
            isAdmin = true;
        }

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.username personal_info.profile_img admin google_auth facebook_auth").then((u) => {
            return u || null
        })
        .catch(err => {
            return res.status(500).json({ "error": err.message })
        })

        if(user) { // login
            if(!user.facebook_auth){
                return res.status(403).json({ "error": "This email was signed up without facebook. Please log in with password to access the account" })
            }
        }
        else { // sign up
            
            let username = await generateUsername(email);

            user = new User({
                personal_info: { fullname: name, email, username },
                admin: isAdmin,
                google_auth: false,
                facebook_auth: true
            })

            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({ "error": err.message })
            })

        }

        return res.status(200).json(formatDatatoSend(user))

    })
    .catch(err => {
        return res.status(500).json({ "error": "Failed to authenticate you with facebook. Try with some other google account" })
    })

})

server.post('/upload-image', upload.single('bannerUrl'), (req, res) => {
    try {
        if (req.file) {
            const db = mongoose.connection.db;
            const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
            
            const filename = `${nanoid()}-${Date.now()}${path.extname(req.file.originalname)}`;
            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    contentType: req.file.mimetype
                }
            });
            
            uploadStream.end(req.file.buffer);

            uploadStream.on('finish', async () => {
                console.log('File uploaded successfully');
                
                const newUpload = new Uploads({
                    filename: filename,
                    contentType: req.file.mimetype,
                    path: `/uploads/${filename}`,
                    size: req.file.size,
                    metadata: {}
                });

                await newUpload.save();

                const imageUrl = `/uploads/${filename}`;
                res.status(200).json({ filename: filename, bannerUrl: imageUrl });
            });
        } else {
            res.status(400).json({ error: 'No file was uploaded' });
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'An error occurred while processing the file' });
    }
});

server.get('/uploads/:filename', async (req, res) => {
    try {
        const file = await Uploads.findOne({ filename: req.params.filename });
        
        if (!file) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }

        // Check if file is an image
        if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.contentType)) {
            const db = mongoose.connection.db;
            const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
            
            // Stream the file from GridFS
            const readstream = bucket.openDownloadStreamByName(req.params.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the file' });
    }
});

server.post('/create-post', async (req, res) => {
    try {
        let username = req.headers['username'];

        if (!username) {
            return res.status(401).json({ error: 'Username is required to create a post' });
        }

        const { title, bannerUrl, des, content, tags, draft, id } = req.body;

        if (!title || !bannerUrl || !des || !content || !tags) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find user by username
        const user = await User.findOne({ "personal_info.username": username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create the post
        const post = new Post({
            post_id: id || new mongoose.Types.ObjectId().toString(),
            title,
            bannerUrl,
            des,
            content,
            tags,
            author: user,
            draft: draft || false
        });

        // Save the post to the database
        await post.save();

        res.status(201).json({ message: 'Post created successfully', postId: post._id });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'An error occurred while creating the post' });
    }
});

server.post("/change-password", verifyJWT, (req, res) => {

    let { currentPassword, newPassword } = req.body; 

    if(!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)){
        return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }

    User.findOne({ _id: req.user })
    .then((user) => {

        if(user.google_auth){
            return res.status(403).json({ error: "You can't change account's password because you logged in through google" })
        }

        bcrypt.compare(currentPassword, user.personal_info.password, (err, result) => {
            if(err) {
                return res.status(500).json({ error: "Some error occured while changing the password, please try again later" })
            }

            if(!result){
                return res.status(403).json({ error: "Incorrect current password" })
            }

            bcrypt.hash(newPassword, 10, (err, hashed_password) => {

                User.findOneAndUpdate({ _id: req.user }, { "personal_info.password": hashed_password })
                .then((u) => {
                    return res.status(200).json({ status: 'password changed' })
                })
                .catch(err => {
                    return res.status(500).json({ error: 'Some error occured while saving new password, please try again later' })
                })

            })
        })

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error : "User not found" })
    })

})

server.post('/latest-posts', (req, res) => {

    let { page } = req.body;

    let maxLimit = 5;

    Post.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("post_id title des bannerUrl activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(posts => {
        return res.status(200).json({ posts })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post("/all-latest-posts-count", (req, res) => {

    Post.countDocuments({ draft: false })
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })

})

server.get("/trending-posts", (req, res) => {

    Post.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
    .select("post_id title publishedAt -_id")
    .limit(5)
    .then(posts => {
        return res.status(200).json({ posts })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post("/search-posts", (req, res) => {

    let { tag, query, author, page, limit, eliminate_post } = req.body;

    let findQuery;

    if(tag){
        findQuery = { tags: tag, draft: false, post_id: { $ne: eliminate_post } };
    } else if(query){
        findQuery = { draft: false, title: new RegExp(query, 'i') } 
    } else if(author) {
        findQuery = { author, draft: false }
    }

    let maxLimit = limit ? limit : 2;
    
    Post.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("post_id title des bannerUrl activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(posts => {
        return res.status(200).json({ posts })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post("/search-posts-count", (req, res) => {

    let { tag, author, query } = req.body;

    let findQuery;

    if(tag){
        findQuery = { tags: tag, draft: false };
    } else if(query){
        findQuery = { draft: false, title: new RegExp(query, 'i') } 
    } else if(author) {
        findQuery = { author, draft: false }
    }

    Post.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })

})

server.post("/search-users", (req, res) => {

    let { query } = req.body;

    User.find({ "personal_info.username": new RegExp(query, 'i') })
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users => {
        return res.status(200).json({ users })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post("/get-profile", (req, res) => {

    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -posts")
    .then(user => {
        return res.status(200).json(user)
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({ error: err.message })
    })

})

server.post("/update-profile-img", verifyJWT, (req, res) => {

    let { url } = req.body;

    User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
    .then(() => {
        return res.status(200).json({ profile_img: url })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post("/update-profile", verifyJWT, (req, res) => {

    let { username, bio, social_links } = req.body;

    let bioLimit = 150;

    if(username.length < 3){
        return res.status(403).json({ error: "Username should be at least 3 letters long" });
    }

    if(bio.length > bioLimit){
        return res.status(403).json({ error: `Bio should not be more than ${bioLimit} characters` });
    }

    let socialLinksArr = Object.keys(social_links);

    try {

        for(let i = 0; i < socialLinksArr.length; i++){
            if(social_links[socialLinksArr[i]].length){
                let hostname = new URL(social_links[socialLinksArr[i]]).hostname; 

                if(!hostname.includes(`${socialLinksArr[i]}.com`) && socialLinksArr[i] != 'website'){
                    return res.status(403).json({ error: `${socialLinksArr[i]} link is invalid. You must enter a full link` })
                }

            }
        }

    } catch (err) {
        return res.status(500).json({ error: "You must provide full social links with http(s) included" })
    }

    let updateObj = {
        "personal_info.username": username,
        "personal_info.bio": bio,
        social_links
    }

    User.findOneAndUpdate({ _id: req.user }, updateObj, {
        runValidators: true
    })
    .then(() => {
        return res.status(200).json({ username })
    })
    .catch(err => {
        if(err.code == 11000){
            return res.status(409).json({ error: "username is already taken" })
        }
        return res.status(500).json({ error: err.message })
    })

})

server.post('/create-post', verifyJWT, (req, res) => {

    let authorId = req.user;
    let isAdmin = req.admin;

    if(isAdmin){

        let { title, des, bannerUrl, tags, content, draft, id } = req.body;

        if(!title.length){
            return res.status(403).json({ error: "You must provide a title" });
        }
    
        if(!draft){
            if(!des.length || des.length > 200){
                return res.status(403).json({ error: "You must provide post description under 200 characters" });
            }
        
            if(!bannerUrl.length){
                return res.status(403).json({ error: "You must provide post banner URL to publish it" });
            }
        
            if(!content.blocks.length){
                return res.status(403).json({ error: "There must be some post content to publish it" });
            }
        
            if(!tags.length || tags.length > 10){
                return res.status(403).json({ error: "Provide tags in order to publish the post, Maximum 10" });
            }
        }
    
        tags = tags.map(tag => tag.toLowerCase());
    
        let post_id = id || title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();
    
        if(id){
    
            Post.findOneAndUpdate({ post_id }, { title, des, bannerUrl, content, tags, draft: draft ? draft : false })
            .then(() => {
                return res.status(200).json({ id: post_id });
            })
            .catch(err => {
                return res.status(500).json({ error: "Failed to update total posts number" })
            })
    
        } else{
    
            let post = new Post({
                title, des, bannerUrl, content, tags, author: authorId, post_id, draft: Boolean(draft)
            })
        
            post.save().then(post => {
        
                let incrementVal = draft ? 0 : 1;
        
                User.findOneAndUpdate({ _id: authorId }, { $inc : { "account_info.total_posts" : incrementVal }, $push : { "posts": post._id } })
                .then(user => {
                    return res.status(200).json({ id: post.post_id })
                })
                .catch(err => {
                    return res.status(500).json({ error: "Failed to update total posts number" })
                })
        
            })
            .catch(err => {
                return res.status(500).json({ error: err.message })
            })
    
        }

    } else {
        return res.status(500).json({ error: "you don't have permissions to create any post" });
    }

})

server.post("/get-post", (req, res) => {

    let { post_id, draft, mode } = req.body;

    let incrementVal = mode != 'edit' ? 1 : 0;

    Post.findOneAndUpdate({ post_id }, { $inc : { "activity.total_reads": incrementVal } })
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title des content bannerUrl activity publishedAt post_id tags")
    .then(post => {

        User.findOneAndUpdate({ "personal_info.username": post.author.personal_info.username }, { 
            $inc : { "account_info.total_reads": incrementVal }
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })

        if(post.draft && !draft){
            return res.status(500).json({ error: 'you can not access draft posts' })
        }

        return res.status(200).json({ post });

    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })

})

server.post("/like-post", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id, islikedByUser } = req.body;

    let incrementVal = !islikedByUser ? 1 : -1;

    Post.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
    .then(post => {

        if(!islikedByUser){
            let like = new Notification({
                type: "like",
                post: _id,
                notification_for: post.author,
                user: user_id
            })

            like.save().then(notification => {
                return res.status(200).json({ liked_by_user: true })
            })
        } else{

            Notification.findOneAndDelete({ user: user_id, post: _id, type: "like" })
            .then(data => {
                return res.status(200).json({ liked_by_user: false })
            })
            .catch(err => {
                return res.status(500).json({ error: err.message });
            })

        }

    })

})

server.post("/isliked-by-user", verifyJWT, (req, res) => {
    
    let user_id = req.user;

    let { _id } = req.body;

    Notification.exists({ user: user_id, type: "like", post: _id })
    .then(result => {
        return res.status(200).json({ result }) 
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

}) 

server.post("/add-comment", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id, comment, post_author, replying_to, notification_id } = req.body;

    if(!comment.length) {
        return res.status(403).json({ error: 'Write something to leave a comment' });
    }

    // creating a comment doc
    let commentObj = {
        post_id: _id, post_author, comment, commented_by: user_id,
    }

    if(replying_to){
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

    new Comment(commentObj).save().then(async commentFile => {

        let { comment, commentedAt, children } = commentFile;

        Post.findOneAndUpdate({ _id }, { $push: { "comments": commentFile._id }, $inc : { "activity.total_comments": 1, "activity.total_parent_comments": replying_to ? 0 : 1 },  })
        .then(post => { console.log('New comment created') });

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            post: _id,
            notification_for: post_author,
            user: user_id,
            comment: commentFile._id
        }

        if(replying_to){

            notificationObj.replied_on_comment = replying_to;

            await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id } })
            .then(replyingToCommentDoc => { notificationObj.notification_for = replyingToCommentDoc.commented_by })

            if(notification_id){
                Notification.findOneAndUpdate({ _id: notification_id }, { reply: commentFile._id })
                .then(notificaiton => console.log('notification updated'))
            }

        }

        new Notification(notificationObj).save().then(notification => console.log('new notification created'));

        return res.status(200).json({
            comment, commentedAt, _id: commentFile._id, user_id, children
        })

    })


}) 

server.post("/get-post-comments", (req, res) => {

    let { post_id, skip } = req.body;

    let maxLimit = 5;

    Comment.find({ post_id, isReply: false })
    .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
    .skip(skip)
    .limit(maxLimit)
    .sort({
        'commentedAt': -1
    })
    .then(comment => {
        console.log(comment, post_id, skip)
        return res.status(200).json(comment);
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })

})

server.post("/get-replies", (req, res) => {

    let { _id, skip } = req.body;

    let maxLimit = 5;

    Comment.findOne({ _id })
    .populate({
        path: "children",
        options: {
            limit: maxLimit,
            skip: skip,
            sort: { 'commentedAt': -1 }
        },
        populate: {
            path: 'commented_by',
            select: "personal_info.profile_img personal_info.fullname personal_info.username"
        },
        select: "-post_id -updatedAt"
    })
    .select("children")
    .then(doc => {
        console.log(doc);
        return res.status(200).json({ replies: doc.children })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

const deleteComments = ( _id ) => {
    Comment.findOneAndDelete({ _id })
    .then(comment => {

        if(comment.parent){
            Comment.findOneAndUpdate({ _id: comment.parent }, { $pull: { children: _id } })
            .then(data => console.log('comment delete from parent'))
            .catch(err => console.log(err));
        }

        Notification.findOneAndDelete({ comment: _id }).then(notification => console.log('comment notification deleted'))

        Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } }).then(notification => console.log('reply notification deleted'))

        Post.findOneAndUpdate({ _id: comment.post_id }, { $pull: { comments: _id }, $inc: { "activity.total_comments": -1 }, "activity.total_parent_comments": comment.parent ? 0 : -1 })
        .then(post => {
            if(comment.children.length){
                comment.children.map(replies => {
                    deleteComments(replies)
                })
            }   
        })

    })
    .catch(err => {
        console.log(err.message);
    })
}

server.post("/delete-comment", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id } = req.body;

    Comment.findOne({ _id })
    .then(comment => {

        if( user_id == comment.commented_by || user_id == comment.post_author ){

            deleteComments(_id)

            return res.status(200).json({ status: 'done' });

        } else{
            return res.status(403).json({ error: "You can not delete this commet" })
        }

    })

})

server.get("/new-notification", verifyJWT, (req, res) => {

    let user_id = req.user;

    Notification.exists({ notification_for: user_id, seen: false, user: { $ne: user_id } })
    .then(result => {
        if( result ){
            return res.status(200).json({ new_notification_available: true })
        } else{
            return res.status(200).json({ new_notification_available: false })
        }
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })

})

server.post("/notifications", verifyJWT, (req, res) => {
    let user_id = req.user;

    let { page, filter, deletedDocCount } = req.body;

    let maxLimit = 10;

    let findQuery = { notification_for: user_id, user: { $ne: user_id } };

    let skipDocs = ( page - 1 ) * maxLimit;

    if(filter != 'all'){
        findQuery.type = filter;
    }

    if(deletedDocCount){
        skipDocs -= deletedDocCount;
    }

    Notification.find(findQuery)
    .skip(skipDocs)
    .limit(maxLimit)
    .populate("post", "title post_id")
    .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
    .populate("comment", "comment")
    .populate("replied_on_comment", "comment")
    .populate("reply", "comment")
    .sort({ createdAt: -1 })
    .select("createdAt type seen reply")
    .then(notifications => {

        Notification.updateMany(findQuery, { seen: true })
        .skip(skipDocs)
        .limit(maxLimit)
        .then(() => console.log('notification seen'));

        return res.status(200).json({ notifications });

    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message });
    })

})

server.post("/all-notifications-count", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { filter } = req.body;

    let findQuery = { notification_for: user_id, user: { $ne: user_id } }

    if(filter != 'all'){
        findQuery.type = filter;
    }

    Notification.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post("/user-written-posts", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { page, draft, query, deletedDocCount } = req.body;

    let maxLimit = 5;
    let skipDocs = (page - 1) * maxLimit;

    if(deletedDocCount){
        skipDocs -= deletedDocCount;
    }

    Post.find({ author: user_id, draft, title: new RegExp(query, 'i') })
    .skip(skipDocs)
    .limit(maxLimit)
    .sort({ publishedAt: -1 })
    .select(" title bannerUrl publishedAt post_id activity des draft -_id ")
    .then(posts => {
        return res.status(200).json({ posts })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })

})

server.post("/user-written-posts-count", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { draft, query } = req.body;

    Post.countDocuments({ author: user_id, draft, title: new RegExp(query, 'i') })
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message });
    })

})

server.post("/delete-post", verifyJWT, (req, res) => {

    let user_id = req.user;
    let isAdmin = req.admin;
    let { post_id } = req.body;


    if(isAdmin) {
        Post.findOneAndDelete({ post_id })
        .then(post => {
            
            Notification.deleteMany({ post: post._id }).then(data => console.log('notifications deleted'));

            Comment.deleteMany({ post_id: post._id }).then(data => console.log('comments deleted'));

            User.findOneAndUpdate({ _id: user_id }, { $pull: { post: post._id }, $inc: { "account_info.total_posts": -1 } })
            .then(user => console.log('Post deleted'));

            return res.status(200).json({ status: 'done' });

        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
    } else {
        return res.status(500).json({ error: "you don't have permissions to delete the post" })
    }

})


server.listen(PORT, '0.0.0.0', () => {
    console.log('listening on port -> ' + PORT);
})