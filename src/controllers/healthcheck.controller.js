import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (_, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;

    const healthStatus = {
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: isDbConnected ? "Connected" : "Disconnected"
    };

    return res
        .status(200)
        .json(new ApiResponse(200, healthStatus, "Server is healthy and running smoothly"));
});

export { healthcheck };
