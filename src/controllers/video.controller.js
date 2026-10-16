import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../services/cloudinary.js";

// 1. Upload & Publish a Video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body || {};

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFile?.url) {
        throw new ApiError(500, "Failed to upload video file to Cloudinary");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail?.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        isPublished: true,
        owner: req.user._id
    });

    const createdVideo = await Video.findById(video._id);
    if (!createdVideo) {
        throw new ApiError(500, "Failed to create video in database");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdVideo, "Video uploaded and published successfully"));
});

// 2. Get All Videos (Paginated feed with search and filter)
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const matchConditions = {};

    if (query?.trim()) {
        matchConditions.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } }
        ];
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId format");
        }
        matchConditions.owner = new mongoose.Types.ObjectId(userId);
    } else {
        matchConditions.isPublished = true;
    }

    const pipeline = [
        {
            $match: matchConditions
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ];

    const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// 3. Get Single Video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId format");
    }

    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    const videoData = await Video.aggregate([
        {
            $match: {
                _id: videoObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: req.user?._id
                                        ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"] }
                                        : false,
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
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
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: req.user?._id
                            ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"] }
                            : false,
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                likes: 0
            }
        }
    ]);

    if (!videoData?.length) {
        throw new ApiError(404, "Video not found");
    }

    const video = videoData[0];

    // Increment video views in DB
    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    });

    // If user is authenticated, add to watch history
    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId }
        });
    }

    video.views += 1;

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

// 4. Update Video Details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body || {};

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this video");
    }

    const updateFields = {};
    if (title?.trim()) {
        updateFields.title = title.trim();
    }
    if (description?.trim()) {
        updateFields.description = description.trim();
    }

    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail?.url) {
            throw new ApiError(500, "Failed to upload new thumbnail");
        }
        if (video.thumbnail) {
            await deleteFromCloudinary(video.thumbnail, "image");
        }
        updateFields.thumbnail = thumbnail.url;
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) is required to update");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// 5. Delete Video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    // Delete media assets from Cloudinary
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile, "video");
    }
    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image");
    }

    // Remove video document
    await Video.findByIdAndDelete(videoId);

    // Clean up related data (likes, comments, playlists, watch history)
    await Like.deleteMany({ video: videoId });
    await Comment.deleteMany({ video: videoId });
    await Playlist.updateMany({}, { $pull: { videos: videoId } });
    await User.updateMany({}, { $pull: { watchHistory: videoId } });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// 6. Toggle Video Publish Status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify this video");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                `Video ${video.isPublished ? "published" : "unpublished"} successfully`
            )
        );
});

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
