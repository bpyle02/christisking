import express from "express";
import mongoose from "mongoose";
import "dotenv/config"
import bcrypt from "bcrypt";
import User from "./schema/User.js";
import jwt from "jsonwebtoken";

const PORT = 3000;
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const server = express();

server.use(express.json());

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

server.post("/signup", (req, res) => {
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
        let username = email.split("@")[0];

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

//    return res.status(200).json({"status": "okay"})
})

server.post("/signin", (req, res) => {
    let { email_or_username, password } = req.body;

    if (email_or_username) {
        if (email_or_username.indexOf("@") != -1) {
            if (email_or_username.indexOf(".", email_or_username.indexOf("@")) != -1) {
                User.findOne({"personal_info.email": email_or_username})
                .then((user) => {
                    console.log(user)
                    return res.json({"status": "Got email document successfully"})
                })
                .catch(e => {
                    console.log(e)
                    return res.status(403).json({"error": "Email was not found"})
                })
            }
        }
    
        User.findOne({"personal_info.username": email_or_username})
        .then((user) => {
            console.log(user)
            return res.json({"status": "Got username document successfully"})
        })
        .catch(e => {
            console.log(e)
            return res.status(403).json({"error": "Username was not found"})
        })
    } else {
        return res.status(403).json({"error": "Username or Email cannot be blank"})
    }

})

server.listen(PORT, () => {
    console.log("listening on port " + PORT)
})