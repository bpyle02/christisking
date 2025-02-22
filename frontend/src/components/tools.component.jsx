// importing tools

import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "../App";

const uploadImageByFile = (file) => {

    let { userAuth: { access_token } } = useContext(UserContext)

    const formData = new FormData();
    formData.append('image', file); // 'image' should match the field name expected by your server

    return axios.post(import.meta.env.VITE_NODE_SERVER_DOMAIN + '/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${access_token}` // If authentication is required
        }
    }).then(response => {
        if (response.data && response.data.bannerUrl) {
            return {
                success: 1,
                file: { url: response.data.bannerUrl } // Assuming 'banner' contains the base64 string
            };
        } else {
            throw new Error('Upload failed');
        }
    }).catch(error => {
        console.error('Error uploading image:', error);
        return { success: 0 };
    });
};

const uploadImageByURL = (url) => {
    return new Promise((resolve, reject) => {
        try {
            resolve({
                success: 1,
                file: { url }
            });
        } catch (err) {
            reject(err);
        }
    });
};

export const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByURL,
                uploadByFile: uploadImageByFile,
            }
        }
    },
    header: {
        class: Header,
        config: {
            placeholder: "Type Heading....",
            levels: [2, 3],
            defaultLevel: 2
        }
    },
    quote: {
        class: Quote,
        inlineToolbar: true
    },
    marker: Marker,
    inlineCode: InlineCode
};