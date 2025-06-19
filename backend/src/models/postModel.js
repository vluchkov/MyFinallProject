import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String }, // Теперь необязательное поле
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: { type: String }, // Теперь не обязательное
    videoUrl: { type: String }, // Для URL видео или пути к загруженному видео
    mediaType: { type: String, required: true, enum: ["image", "video"] }, // 'image' или 'video'
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
