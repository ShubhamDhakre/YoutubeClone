# 🚀 YouTube Clone Backend: Complete Route-by-Route Guide ("working.md")

Welcome to the complete, beginner-friendly operational guide for the **YouTube Clone Backend**. This guide breaks down **all routes** in this project—both the ones that are **finished and working (DONE)** and the ones planned for the future **(PENDING)**.

For every single route, you will find:
1. **Status**: Whether it is implemented and working (✅ DONE) or waiting to be built (⏳ PENDING).
2. **Request Data**: Exactly what data the client must send (Headers, URL params, Body, or Files).
3. **Response Data**: What JSON data the client receives back.
4. **Logic in Simple Language**: A step-by-step, human explanation of *how it works* and *how it was made*.

---

## 📑 Table of Contents
- [Summary Dashboard](#-summary-dashboard)
- [PART 1: Done & Working Routes (User & Channel Engine)](#part-1-done--working-routes-user--channel-engine)
  - [1. User Registration (`POST /register`)](#1-user-registration-post-apiv1usersregister)
  - [2. User Login (`POST /login`)](#2-user-login-post-apiv1userslogin)
  - [3. User Logout (`POST /logout`)](#3-user-logout-post-apiv1userslogout)
  - [4. Refresh Access Token (`POST /refresh-token`)](#4-refresh-access-token-post-apiv1usersrefresh-token)
  - [5. Change Password (`POST /change-password`)](#5-change-password-post-apiv1userschange-password)
  - [6. Get Current User (`GET /current-user`)](#6-get-current-user-get-apiv1userscurrent-user)
  - [7. Update Account Details (`PATCH /update-account`)](#7-update-account-details-patch-apiv1usersupdate-account)
  - [8. Update Avatar Image (`PATCH /update-avatar`)](#8-update-avatar-image-patch-apiv1usersupdate-avatar)
  - [9. Update Cover Image (`PATCH /update-cover-image`)](#9-update-cover-image-patch-apiv1usersupdate-cover-image)
  - [10. Get User Channel Profile (`GET /c/:username`)](#10-get-user-channel-profile-get-apiv1userscusername)
  - [11. Get Watch History (`GET /history`)](#11-get-watch-history-get-apiv1usershistory)
- [PART 2: Pending Routes (To Be Built Next)](#part-2-pending-routes-to-be-built-next)
  - [A. Video Routes (`/api/v1/videos`)](#a-video-routes-apiv1videos--6-routes)
  - [B. Subscription Routes (`/api/v1/subscriptions`)](#b-subscription-routes-apiv1subscriptions--3-routes)
  - [C. Like Routes (`/api/v1/likes`)](#c-like-routes-apiv1likes--4-routes)
  - [D. Comment Routes (`/api/v1/comments`)](#d-comment-routes-apiv1comments--4-routes)
  - [E. Playlist Routes (`/api/v1/playlists`)](#e-playlist-routes-apiv1playlists--7-routes)
  - [F. Tweet & Community Routes (`/api/v1/tweets`)](#f-tweet--community-routes-apiv1tweets--4-routes)
  - [G. Creator Studio Dashboard Routes (`/api/v1/dashboard`)](#g-creator-studio-dashboard-routes-apiv1dashboard--2-routes)
  - [H. Health Check Route (`/api/v1/healthcheck`)](#h-health-check-route-apiv1healthcheck--1-route)
- [Core Helpers Explained Simply](#-core-helpers-explained-simply)

---

## 📊 Summary Dashboard

| Feature Module | Base URL | Route Count | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **User & Channel** | `/api/v1/users` | **11** | ✅ **DONE** | Complete auth, profile updates, media uploads, channel metrics & watch history. |
| **Videos** | `/api/v1/videos` | **6** | ⏳ **PENDING** | Video upload, pagination, search, editing, views increment & delete. |
| **Subscriptions** | `/api/v1/subscriptions` | **3** | ⏳ **PENDING** | Subscribe/unsubscribe toggle, channel subscribers list & following list. |
| **Likes** | `/api/v1/likes` | **4** | ⏳ **PENDING** | Like/unlike videos, comments, tweets & liked videos feed. |
| **Comments** | `/api/v1/comments` | **4** | ⏳ **PENDING** | Adding, reading, editing, and deleting comments on videos. |
| **Playlists** | `/api/v1/playlists` | **7** | ⏳ **PENDING** | Creating playlists, adding/removing videos, viewing user playlists. |
| **Community Tweets** | `/api/v1/tweets` | **4** | ⏳ **PENDING** | Text-based channel posts, editing & fetching creator posts. |
| **Creator Dashboard** | `/api/v1/dashboard` | **2** | ⏳ **PENDING** | Channel overview metrics (total views, likes, subs) & video studio table. |
| **Health Check** | `/api/v1/healthcheck` | **1** | ⏳ **PENDING** | Server and database liveness ping. |
| **TOTAL** | | **42** | **11 Done / 31 Pending** | |

---

# PART 1: Done & Working Routes (User & Channel Engine)

All these 11 routes are implemented in `src/controllers/user.controller.js` and wired into `src/routes/user.routes.js`.

---

### 1. User Registration (`POST /register`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `POST http://localhost:8000/api/v1/users/register`
* **Access Level:** Public (Anyone can register)
* **Middlewares Used:** `upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }])`

#### Data It Receives (Request):
* **Format:** `multipart/form-data`
* **Body Fields:**
  * `fullName` *(String, Required)*: e.g. `"John Doe"`
  * `email` *(String, Required)*: e.g. `"john@example.com"`
  * `userName` *(String, Required)*: e.g. `"johndoe"`
  * `password` *(String, Required)*: e.g. `"superSecret123"`
* **Files Attached:**
  * `avatar` *(Image file, Required)*: User's profile photo
  * `coverImage` *(Image file, Optional)*: Channel banner/cover picture

#### Data It Sends Back (Response):
* **HTTP Status:** `201 Created`
* **Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "userName": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "avatar": "https://res.cloudinary.com/.../avatar.jpg",
    "coverImage": "https://res.cloudinary.com/.../cover.jpg",
    "watchHistory": [],
    "createdAt": "2026-10-10T12:00:00.000Z",
    "updatedAt": "2026-10-10T12:00:00.000Z"
  },
  "message": "User registered successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. **Multer Intercepts Files**: When the client clicks submit, Multer grabs `avatar` and `coverImage` and drops them into the `./public/temp` local folder.
2. **Field Validation**: The controller checks if `fullName`, `email`, `userName`, and `password` exist and are not empty strings. If any is missing, it throws an `ApiError(400)`.
3. **Duplicate Check**: The database is queried (`User.findOne`) to see if any user already has that `userName` or `email`. If someone does, it throws `ApiError(409)`.
4. **Avatar Check**: An avatar is mandatory. If no file path exists, it throws `ApiError(400)`.
5. **Cloudinary Upload**: It calls `uploadOnCloudinary(avatarLocalPath)`. Cloudinary uploads the image to the cloud and returns a secure HTTPS URL. The temporary local file in `./public/temp` is instantly deleted to keep your hard disk clean.
6. **Optional Cover Image**: If a cover image was uploaded, it sends it to Cloudinary as well.
7. **Create User in MongoDB**: `User.create(...)` creates the document. Before saving, Mongoose's `pre("save")` hook triggers automatically, running bcrypt with 10 salt rounds to securely hash the password.
8. **Sanitize & Respond**: It fetches the newly saved document, strips out `password` and `refreshToken`, and sends a 201 success response with `ApiResponse`.

---

### 2. User Login (`POST /login`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `POST http://localhost:8000/api/v1/users/login`
* **Access Level:** Public
* **Middlewares Used:** None

#### Data It Receives (Request):
* **Format:** `application/json` or `application/x-www-form-urlencoded`
* **Body Fields:**
  * `email` or `userName` *(String, Required)*: The identifier the user signs in with.
  * `password` *(String, Required)*: The plaintext password.

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Cookies Set:**
  * `accessToken` (HTTP-only cookie, expires in 1 day)
  * `refreshToken` (HTTP-only cookie, expires in 10 days)
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "670868f1c841c9e8312a0011",
      "userName": "johndoe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": "https://res.cloudinary.com/.../avatar.jpg",
      "coverImage": "https://res.cloudinary.com/.../cover.jpg"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. **Find User**: Accepts either email or username, converts it to lowercase, and searches MongoDB (`User.findOne`). If not found, throws `ApiError(404)`.
2. **Verify Password**: Calls `user.isPasswordCorrect(password)`. Bcrypt compares the raw password with the stored hash. If they don't match, throws `ApiError(401)`.
3. **Generate JWT Pair**:
   * **Access Token**: Short-lived token packed with user details (`_id`, `userName`, `email`, `fullName`).
   * **Refresh Token**: Long-lived token containing only the user's `_id`.
4. **Save Refresh Token to DB**: The refresh token is saved directly on the user's MongoDB document (`user.refreshToken = refreshToken; await user.save(...)`).
5. **HTTP-only Cookies**: Both tokens are attached as HTTP-only cookies (preventing client-side JavaScript theft via XSS) and also returned in the JSON payload.

---

### 3. User Logout (`POST /logout`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `POST http://localhost:8000/api/v1/users/logout`
* **Access Level:** 🔒 Secured (User must be logged in)
* **Middlewares Used:** `verifyJWT`

#### Data It Receives (Request):
* **Cookie or Authorization Header:**
  * Cookie: `accessToken`
  * OR Header: `Authorization: Bearer <accessToken>`

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Cookies Cleared:** `accessToken`, `refreshToken`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. **Auth Verification**: The `verifyJWT` middleware decodes the access token and attaches the authenticated user to `req.user`.
2. **Invalidate in Database**: Runs `User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } })`. This removes the refresh token from MongoDB so it can never be used again.
3. **Clear Cookies**: Tells the client's browser to delete the `accessToken` and `refreshToken` cookies, leaving the user completely logged out.

---

### 4. Refresh Access Token (`POST /refresh-token`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `POST http://localhost:8000/api/v1/users/refresh-token`
* **Access Level:** Public / Token-based
* **Middlewares Used:** None

#### Data It Receives (Request):
* **Cookie or Body:**
  * Cookie `refreshToken` OR Body `{ "refreshToken": "..." }`

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Cookies Updated:** `newAccessToken`, `newRefreshToken`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "user": { ... },
    "newAccessToken": "ey...",
    "newRefreshToken": "ey..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. **Extract Token**: Reads the incoming refresh token from cookies or request body.
2. **Verify Cryptography**: Uses `jwt.verify(token, REFRESH_TOKEN_SECRET)` to ensure the token has not been tampered with or expired.
3. **Database Match**: Looks up the user in MongoDB. Crucially, it verifies that `user.refreshToken === incomingRefreshToken`. (If the user had logged out earlier, this will not match, blocking stolen tokens).
4. **Issue Fresh Tokens**: Generates a brand new access and refresh token pair, saves the new refresh token to MongoDB, and returns them in new cookies and response.

---

### 5. Change Password (`POST /change-password`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `POST http://localhost:8000/api/v1/users/change-password`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`

#### Data It Receives (Request):
* **Auth:** Access token cookie or Bearer header
* **Body:**
```json
{
  "oldPassword": "myOldPassword123",
  "newPassword": "myBrandNewPassword456"
}
```

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. **Retrieve User**: Finds the user document by `req.user._id`.
2. **Verify Old Password**: Runs `user.isPasswordCorrect(oldPassword)`. If wrong, throws `ApiError(401, "Invalid Current Password")`.
3. **Update & Hash**: Assigns `user.password = newPassword` and calls `user.save()`. Because `password` was modified, Mongoose's `pre("save")` hook triggers, automatically hashing the new password with bcrypt before writing to disk.

---

### 6. Get Current User (`GET /current-user`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `GET http://localhost:8000/api/v1/users/current-user`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`

#### Data It Receives (Request):
* **Auth:** Access token cookie or Bearer header

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "userName": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "avatar": "https://res.cloudinary.com/.../avatar.jpg",
    "coverImage": "https://res.cloudinary.com/.../cover.jpg"
  },
  "message": "Current user fetched successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. `verifyJWT` runs first: it finds the user in DB, strips out sensitive fields (`-password -refreshToken`), and places the clean user object onto `req.user`.
2. The controller simply returns `req.user` wrapped in `ApiResponse`. Perfect for frontend page loads to check if a user is still logged in.

---

### 7. Update Account Details (`PATCH /update-account`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `PATCH http://localhost:8000/api/v1/users/update-account`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`

#### Data It Receives (Request):
* **Body:**
```json
{
  "fullName": "John Jonathan Doe",
  "email": "newjohn@example.com"
}
```

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "userName": "johndoe",
    "email": "newjohn@example.com",
    "fullName": "John Jonathan Doe",
    "avatar": "...",
    "coverImage": "..."
  },
  "message": "User details updated successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. Validates that `fullName` and `email` are provided.
2. Calls `User.findByIdAndUpdate` using `$set: { fullName, email }` with `{ new: true }` so it returns the freshly updated document. Password and image fields are untouched.

---

### 8. Update Avatar Image (`PATCH /update-avatar`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `PATCH http://localhost:8000/api/v1/users/update-avatar`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`, `upload.single("avatar")`

#### Data It Receives (Request):
* **Format:** `multipart/form-data`
* **Files:** `avatar` *(single image file)*

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "avatar": "https://res.cloudinary.com/.../new_avatar.jpg",
    "fullName": "John Doe",
    "userName": "johndoe"
  },
  "message": "Avatar updated successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
1. Multer receives the uploaded file and stores it in `./public/temp`.
2. Controller uploads the file to Cloudinary and gets back the permanent HTTPS URL.
3. Automatically deletes the temporary local file from the server.
4. Updates `avatar: newUrl` in MongoDB and returns the updated user.

---

### 9. Update Cover Image (`PATCH /update-cover-image`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `PATCH http://localhost:8000/api/v1/users/update-cover-image`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`, `upload.single("coverImage")`

#### Data It Receives (Request):
* **Format:** `multipart/form-data`
* **Files:** `coverImage` *(single image file)*

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "coverImage": "https://res.cloudinary.com/.../new_cover.jpg"
  },
  "message": "Cover image updated successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
* Works identical to `updateAvatar`, updating the `coverImage` field on the user's document.

---

### 10. Get User Channel Profile (`GET /c/:username`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `GET http://localhost:8000/api/v1/users/c/johndoe`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`

#### Data It Receives (Request):
* **URL Param:** `:username` (e.g. `johndoe`)
* **Auth:** Access token cookie / Bearer header (representing the *viewer*)

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "fullName": "John Doe",
    "userName": "johndoe",
    "avatar": "https://res.cloudinary.com/.../avatar.jpg",
    "coverImage": "https://res.cloudinary.com/.../cover.jpg",
    "subscriberCount": 45,
    "channelSubscribers": 12,
    "isSubscribed": true
  },
  "message": "User channel profile fetched successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
This route uses a **MongoDB Aggregation Pipeline**:
1. `$match`: Finds the channel owner whose `userName` equals the requested username (lowercased).
2. `$lookup` (subscribers): Inspects the `subscriptions` collection where `channel === channelOwner._id`. Every match represents someone subscribed to this channel.
3. `$lookup` (subscribedTo): Inspects the `subscriptions` collection where `subscriber === channelOwner._id`. Every match represents a channel this user follows.
4. `$addFields`:
   * `subscriberCount`: Counts how many people subscribed to this channel using `$size`.
   * `isSubscribed`: Checks if the logged-in viewer's ID (`req.user._id`) is present in the subscribers list using `$in` and `$cond`. If true, the frontend shows "Subscribed"; if false, it shows "Subscribe".
5. `$project`: Selects only public profile fields and calculated metrics, excluding all private credentials.

---

### 11. Get Watch History (`GET /history`)
* **Status:** ✅ **DONE & WORKING**
* **Full URL:** `GET http://localhost:8000/api/v1/users/history`
* **Access Level:** 🔒 Secured
* **Middlewares Used:** `verifyJWT`

#### Data It Receives (Request):
* **Auth:** Access token cookie / Bearer header

#### Data It Sends Back (Response):
* **HTTP Status:** `200 OK`
* **Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "watchHistory": [
      {
        "_id": "670870f2c841c9e8312a0099",
        "title": "Complete Node.js Tutorial 2026",
        "description": "Learn backend from scratch...",
        "videoFile": "https://res.cloudinary.com/.../video.mp4",
        "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
        "duration": 1420,
        "views": 3200,
        "owner": {
          "_id": "670868f1c841c9e8312a0011",
          "fullName": "Tech Channel",
          "userName": "techchannel",
          "avatar": "https://res.cloudinary.com/.../avatar.jpg"
        }
      }
    ]
  },
  "message": "Watch history fetched successfully",
  "success": true
}
```

#### Logic in Simple Language (How It Was Made):
Uses a **Nested MongoDB Aggregation Pipeline**:
1. `$match`: Matches the current logged-in user by `req.user._id`.
2. `$lookup` (videos): Takes the list of video IDs stored in `user.watchHistory` and joins with the `videos` collection.
3. Nested Sub-Pipeline: Inside each video join, it runs a second `$lookup` on the `users` collection using `video.owner`, projecting only the video creator's `fullName`, `userName`, and `avatar`.
4. Now the client receives the complete video card data, including creator info, in a single lightning-fast database round-trip.

---

# PART 2: Pending Routes (To Be Built Next)

These 31 routes are planned for the upcoming branches to turn your project into a full-featured video platform.

---

## A. Video Routes (`/api/v1/videos`) — 6 Routes
*Uses existing [`video.model.js`](file:///media/shubhamdhakre/ACER/YoutubeClone/src/models/video.model.js)*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. POST /api/v1/videos/                                                     │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT, upload.fields([{ videoFile }, { thumbnail }])  │
│    • Receives: multipart/form-data: title, description, videoFile, thumbnail│
│    • Returns: 201 Created with saved Video document (Cloudinary URLs)       │
│    • Logic: Multer uploads video and thumbnail to Cloudinary. Cloudinary    │
│      automatically calculates video duration. Video record created in DB.   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. GET /api/v1/videos/                                                      │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: None (Public feed)                                        │
│    • Receives: Query params: ?page=1&limit=10&query=react&sortBy=views     │
│    • Returns: 200 OK with paginated list of video cards and owner details   │
│    • Logic: Uses mongooseAggregatePaginate. Filters videos by title search, │
│      only retrieves isPublished: true, sorts by date or view count.         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. GET /api/v1/videos/:videoId                                              │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: Optional verifyJWT                                        │
│    • Receives: URL param :videoId                                           │
│    • Returns: 200 OK with full video details and channel owner data         │
│    • Logic: Finds video by ID, executes $inc: { views: 1 }, appends videoId │
│      to the logged-in user's watchHistory array.                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. PATCH /api/v1/videos/:videoId                                            │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT, upload.single("thumbnail")                     │
│    • Receives: :videoId, body: { title, description }, optional thumbnail   │
│    • Returns: 200 OK with updated video details                             │
│    • Logic: Verifies req.user._id equals video.owner. If new thumbnail sent,│
│      uploads to Cloudinary and replaces old thumbnail. Updates DB.          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. DELETE /api/v1/videos/:videoId                                           │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Receives: URL param :videoId                                           │
│    • Returns: 200 OK with confirmation message                              │
│    • Logic: Verifies ownership. Deletes videoFile and thumbnail from        │
│      Cloudinary. Removes video document from MongoDB.                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. PATCH /api/v1/videos/toggle/publish/:videoId                             │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Receives: URL param :videoId                                           │
│    • Returns: 200 OK with { isPublished: true/false }                       │
│    • Logic: Flips boolean video.isPublished = !video.isPublished.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## B. Subscription Routes (`/api/v1/subscriptions`) — 3 Routes
*Uses existing [`subscription.model.js`](file:///media/shubhamdhakre/ACER/YoutubeClone/src/models/subscription.model.js)*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. POST /api/v1/subscriptions/c/:channelId                                  │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Receives: URL param :channelId                                         │
│    • Returns: 200 OK with { subscribed: true/false }                        │
│    • Logic: Checks if a document exists where subscriber: req.user._id and  │
│      channel: channelId. If it exists, deletes it (unsubscribes). If not,  │
│      creates it (subscribes).                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. GET /api/v1/subscriptions/c/:channelId                                   │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Receives: URL param :channelId                                         │
│    • Returns: 200 OK with array of subscribers (with avatar & username)     │
│    • Logic: Finds all subscriptions where channel: channelId and populates  │
│      the subscriber field from the User model.                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. GET /api/v1/subscriptions/u/:subscriberId                                │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Receives: URL param :subscriberId                                      │
│    • Returns: 200 OK with array of channels followed by this user           │
│    • Logic: Finds all subscriptions where subscriber: subscriberId and      │
│      populates the channel field.                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## C. Like Routes (`/api/v1/likes`) — 4 Routes
*Requires creating `src/models/like.model.js`*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. POST /api/v1/likes/toggle/v/:videoId                                     │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :videoId. Returns: { isLiked: true/false }                   │
│    • Logic: Toggles like document for (video: videoId, likedBy: req.user).  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. POST /api/v1/likes/toggle/c/:commentId                                   │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :commentId. Returns: { isLiked: true/false }                 │
│    • Logic: Toggles like document for comment.                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. POST /api/v1/likes/toggle/t/:tweetId                                     │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :tweetId. Returns: { isLiked: true/false }                   │
│    • Logic: Toggles like document for community tweet/post.                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. GET /api/v1/likes/videos                                                 │
│    • Status: ⏳ PENDING                                                     │
│    • Returns: 200 OK with array of liked videos with creator details        │
│    • Logic: Aggregates all like docs where likedBy: req.user._id and video  │
│      field is populated, returning the user's "Liked Videos" collection.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D. Comment Routes (`/api/v1/comments`) — 4 Routes
*Requires creating `src/models/comment.model.js`*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. GET /api/v1/comments/:videoId                                            │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :videoId, ?page=1&limit=10                                   │
│    • Returns: Paginated list of comments with author profile & like counts. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. POST /api/v1/comments/:videoId                                           │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :videoId, body: { content: "Great video!" }                  │
│    • Returns: 201 Created with the new comment document.                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. PATCH /api/v1/comments/c/:commentId                                      │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :commentId, body: { content: "Updated comment text" }        │
│    • Returns: 200 OK with updated comment.                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. DELETE /api/v1/comments/c/:commentId                                     │
│    • Status: ⏳ PENDING                                                     │
│    • Receives: :commentId. Returns: 200 OK deletion confirmation.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## E. Playlist Routes (`/api/v1/playlists`) — 7 Routes
*Requires creating `src/models/playlist.model.js`*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. POST /api/v1/playlists/                                                  │
│    • Status: ⏳ PENDING                                                     │
│    • Body: { name, description }                                            │
│    • Returns: 201 Created with new playlist.                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. GET /api/v1/playlists/:playlistId                                        │
│    • Status: ⏳ PENDING                                                     │
│    • Returns: Playlist document with all contained video objects populated. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. PATCH /api/v1/playlists/:playlistId                                      │
│    • Status: ⏳ PENDING                                                     │
│    • Body: { name, description } -> Updates playlist title/info.            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. DELETE /api/v1/playlists/:playlistId                                     │
│    • Status: ⏳ PENDING                                                     │
│    • Removes playlist from database.                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. PATCH /api/v1/playlists/add/:videoId/:playlistId                         │
│    • Status: ⏳ PENDING                                                     │
│    • Logic: Appends videoId to playlist.videos array using $addToSet.       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. PATCH /api/v1/playlists/remove/:videoId/:playlistId                      │
│    • Status: ⏳ PENDING                                                     │
│    • Logic: Removes videoId from playlist.videos using $pull.               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 7. GET /api/v1/playlists/user/:userId                                       │
│    • Status: ⏳ PENDING                                                     │
│    • Returns: All playlists created by a specific user or channel.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## F. Tweet & Community Routes (`/api/v1/tweets`) — 4 Routes
*Requires creating `src/models/tweet.model.js`*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. POST /api/v1/tweets/                                                     │
│    • Status: ⏳ PENDING                                                     │
│    • Body: { content: "Livestream starting at 5 PM!" }                      │
│    • Returns: 201 Created with tweet document.                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. GET /api/v1/tweets/user/:userId                                          │
│    • Status: ⏳ PENDING                                                     │
│    • Returns: All community posts published by the given creator.           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. PATCH /api/v1/tweets/:tweetId                                            │
│    • Status: ⏳ PENDING                                                     │
│    • Body: { content: "Updated announcement" }                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. DELETE /api/v1/tweets/:tweetId                                           │
│    • Status: ⏳ PENDING                                                     │
│    • Deletes creator community post.                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## G. Creator Studio Dashboard Routes (`/api/v1/dashboard`) — 2 Routes
*Uses existing models*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. GET /api/v1/dashboard/stats                                              │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Returns: Channel metrics:                                              │
│      {                                                                      │
│        totalVideoViews: 124500,                                             │
│        totalSubscribers: 1540,                                              │
│        totalVideos: 28,                                                     │
│        totalLikes: 8900                                                     │
│      }                                                                      │
│    • Logic: Aggregation pipeline summing views across user's videos,        │
│      counting subscriptions, and counting likes on all uploaded videos.     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. GET /api/v1/dashboard/videos                                             │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: verifyJWT                                                 │
│    • Returns: List of all creator's uploaded videos with publish toggle,    │
│      views, likes count, and upload date for YouTube Studio table.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## H. Health Check Route (`/api/v1/healthcheck`) — 1 Route

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. GET /api/v1/healthcheck                                                  │
│    • Status: ⏳ PENDING                                                     │
│    • Middlewares: None                                                      │
│    • Returns: 200 OK { status: "OK", uptime: 1245.8, timestamp: ... }       │
│    • Logic: Simple ping used by Docker, load balancers, and monitoring tools│
│      to ensure the server and MongoDB connection are healthy.               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Core Helpers Explained Simply

* **`asyncHandler`**: In Node.js, asynchronous operations can throw errors that crash the server if unhandled. Instead of typing `try { ... } catch (err) { next(err) }` inside every single function, `asyncHandler` wraps the controller automatically. If an error occurs, it catches it and sends back a formatted error response.
* **`ApiError`**: Standardizes error handling. Instead of generic 500 errors, we can throw `new ApiError(404, "User not found")` or `new ApiError(400, "Password required")`.
* **`ApiResponse`**: Standardizes success formatting so frontend developers always receive a consistent schema: `{ statusCode, data, message, success: true }`.
* **`verifyJWT`**: Protects routes by checking the client's token against our secret key. If valid, it decodes the user's ID, fetches their record, and attaches it to `req.user`.
* **`uploadOnCloudinary`**: Transfers files from your server's temporary disk (`./public/temp`) to the cloud storage provider (Cloudinary) and immediately deletes the temporary disk copy.
