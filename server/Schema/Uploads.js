import mongoose, { Schema } from "mongoose";

const uploadsSchema = mongoose.Schema({

    filename: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Object
    }
}, {
    timestamps: true
});

export default mongoose.model("uploads", uploadsSchema);