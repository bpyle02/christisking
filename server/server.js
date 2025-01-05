import express from "express";
import mongoose from "mongoose";
import "dotenv/config"
import bcrypt from "bcrypt";
import User from "./Schema/User.js";
import jwt from "jsonwebtoken";
import cors from 'cors';
import admin from 'firebase-admin';
import firebasePrivateKey from './firebase_private_key.json' with {type: "json"}
import multer from "multer";
import { MongoClient } from "mongodb";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = 3000;
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

admin.initializeApp({
    credentials: admin.credential.cert(firebasePrivateKey),
    projectId: "christisking-92eae",
})

const server = express();

server.use(express.json());
server.use(cors())

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})

const formatDataToSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);

    return {
        access_token: access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        firstname: user.personal_info.firstname,
        lastname: user.personal_info.lastname
    }
}

const generateUsername = async (email) => {
    let username = email.split("@")[0];
    let isUsernameNotUnique = await User.exists({"personal_info.username": username}).then((result) => result)

    isUsernameNotUnique ? username += nanoid().substring(0, 5) : "";

    return username;
}

server.post("/signup", async (req, res) => {
   let { firstname, lastname, email = undefined, password, username } = req.body;

    if(firstname.length < 3) {
        return res.status(403).json({"error": "First name must be more than 2 characters long"})
    }

    if(lastname.length < 3) {
        return res.status(403).json({"error": "First name must be more than 2 characters long"})
    }

    if(username.length < 3) {
        return res.status(403).json({"error": "Username must be more than 2 characters long"})
    }
 
    if(!email.length) {
        return res.status(403).json({"error": "Email cannot be blank"})
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(403).json({"error": "Email is invalid"})
    }

    if (!PASSWORD_REGEX.test(password)) {
        return res.status(403).json({"error": "Password must be between 6 and 20 characters, include at least one number, one uppercase letter, and one lowercase letter"})
    }

    bcrypt.hash(password, 10, (err, hashed_password) => {
        let user = new User({
            personal_info: { firstname, lastname, email, password: hashed_password, username }
        })

        user.save().then((u) => {
            return res.status(200).json(formatDataToSend(u))
        })
        .catch(err => {
            if (err.code == 11000) {
                return res.status(500).json({"error": "Email and/or Username already exists"})
            }

            return res.status(500).json({"error": err.message})
        })
    })
})

server.post("/signin", async (req, res) => {
    let { email_or_username, password } = req.body;

    if (email_or_username) {
        if (email_or_username.indexOf("@") != -1) {
            if (email_or_username.indexOf(".", email_or_username.indexOf("@")) != -1) {
                User.findOne({"personal_info.email": email_or_username})
                .then((user) => {
                    console.log(user)

                    bcrypt.compare(password, user.personal_info.password, (e, result) => {
                        if (e) {
                            return res.status(403).json({"error": "An error occurred while logging in, please try again"})
                        }

                        if (!result) {
                            return res.status(403).json({"error": "Incorrect Username/Email or Password. Please try again"})
                        } else {
                            return res.status(200).json(formatDataToSend(user))
                        }
                    })
                })
                .catch(e => {
                    console.log(e)
                    return res.status(403).json({"error": "Username/Email could not be found. Please try again"})
                })
            }
        }
    
        User.findOne({"personal_info.username": email_or_username})
        .then((user) => {

            if (!user.google_auth) {
                bcrypt.compare(password, user.personal_info.password, (e, result) => {
                    if (e) {
                        return res.status(403).json({"error": "An error occurred while logging in, please try again"})
                    }
    
                    if (!result) {
                        return res.status(403).json({"error": "Incorrect Username/Email or Password. Please try again"})
                    } else {
                        return res.status(200).json(formatDataToSend(user))
                    }
                })
            } else {
                return res.status(403).json({"error":"Account was created with Google. Please login using Google Authentication"})
            }

        })
        .catch(e => {
            console.log(e)
            return res.status(403).json({"error": "Username was not found"})
        })
    } else {
        return res.status(403).json({"error": "Username or Email cannot be blank"})
    }

})

server.post("/google-auth", async (req, res) => {
    
    let { access_token } = req.body;

    try { 
        const decodedUser = await admin.auth().verifyIdToken(access_token);
        let { email, name, picture } = decodedUser;
        
        picture = picture.replace("s96-c", "s384-c");

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.firstname personal_info.lastname personal_info.profile_img personal_info.google_auth");

        if (user) {
            if (!user.personal_info.google_auth) {
                return res.status(403).json({"error": "This email was signed up without Google. Please sign in with your password to access the account"});
            }
        } else {
            let username = await generateUsername(email);
            const splitName = name.split(' ');
            user = new User({
                personal_info: {
                    firstname: splitName[0],
                    lastname: splitName.length > 1 ? splitName.slice(1).join(' ') : '',
                    email,
                    profile_img: picture,
                    username,
                    google_auth: true
                }
            });

            await user.save();
        }

        return res.status(200).json(formatDataToSend(user));
    } catch (e) {
        console.error("Error in Google authentication:", e);
        return res.status(500).json({"error": "Failed to authenticate with Google, please try again"});
    }
});

server.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const client = new MongoClient(process.env.DB_LOCATION);
        await client.connect();
        const db = client.db('christisking-cluster-0');
        const collection = db.collection('images');

        // Convert the buffer to base64 string for storage
        const image = {
            contentType: req.file.mimetype,
            data: req.file.buffer.toString('base64')
        };

        const result = await collection.insertOne(image);
        console.log(result)
        res.status(200).json({ message: "File uploaded successfully", imageId: result.insertedId });
        await client.close();
    } catch (error) {
        console.error("Failed to upload file:", error);
        res.status(500).send("Failed to upload file");
    }
});

server.get('/image/:id', async (req, res) => {
    try {
        const client = new MongoClient(process.env.DB_LOCATION);
        await client.connect();
        const db = client.db('christisking-cluster-0');
        const collection = db.collection('images');

        const image = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!image) {
            return res.status(404).send('Image not found');
        }

        res.setHeader('Content-Type', image.contentType);
        res.send(Buffer.from(image.data, 'base64'));
        await client.close();
    } catch (error) {
        console.error("Failed to retrieve file:", error);
        res.status(500).send("Failed to retrieve file");
    }
});

server.listen(PORT, () => {
    console.log("listening on port " + PORT)
})