import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. Get Channel Stats (Total video views, subscribers, videos, likes)
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Total Video Views & Total Videos Count
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideoViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    // Total Subscribers Count
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    });

    // Total Likes on All Videos Owned by This Channel
    const userVideos = await Video.find({ owner: userId }).select("_id");
    const videoIds = userVideos.map((v) => v._id);

    const totalLikes = await Like.countDocuments({
        video: { $in: videoIds }
    });

    const stats = {
        totalVideoViews: videoStats[0]?.totalVideoViews || 0,
        totalSubscribers: totalSubscribers || 0,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalLikes: totalLikes || 0
    };

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

// 2. Get All Uploaded Videos by Creator for Studio Table
const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" }
            }
        },
        {
            $project: {
                likes: 0,
                comments: 0
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats,
    getChannelVideos
};
