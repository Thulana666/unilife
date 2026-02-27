import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({

text: {
type: String,
required: true
},

sender: {
type: String,
required: true
},

year: Number,

semester: Number,

createdAt: {
type: Date,
default: Date.now
}

});

export default mongoose.models.Message ||
mongoose.model("Message", MessageSchema);
