import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'

const PORT = 3000;
const server = express();

server.use(express.json());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})

server.post('/signup', (req, res) => {
   let { firstname, lastname, email = undefined, password } = req.body;

    if(firstname.length < 3) {
        return res.status(403).json({"error": "First name must be more than 2 characters long"})
    }

    if(lastname.length < 3) {
        return res.status(403).json({"error": "First name must be more than 2 characters long"})
    }

    if(!email.length) {
        return res.status(403).json({"error": "Email cannot be blank"})
    }

   return res.status(200).json({"status": "okay"})
})

server.listen(PORT, () => {
    console.log('listenng on port ' + PORT)
})