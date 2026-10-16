# 🎨 YouTube Clone — Frontend Integration & Architecture Guide (`frontendRefence.md`)

Welcome to the definitive, complete frontend development reference for the **YouTube Clone** project. This guide contains everything a frontend engineer or UI/UX designer needs to build, connect, and style a modern, high-performance web application powered by our Express & MongoDB backend.

---

## 📑 Table of Contents
1. [Network & Client Setup](#1-network--client-setup)
   - [Base URL & Environment](#base-url--environment)
   - [Authentication & Cookie Handling](#authentication--cookie-handling)
   - [Axios Instance with Auto-Token Refresh](#axios-instance-with-auto-token-refresh)
   - [Standard API Response & Error Schema](#standard-api-response--error-schema)
2. [Complete Route-by-Route API Reference (42 Endpoints)](#2-complete-route-by-route-api-reference-42-endpoints)
   - [Module 1: Authentication & User Profile (`/api/v1/users`)](#module-1-authentication--user-profile-apiv1users)
   - [Module 2: Video Engine (`/api/v1/videos`)](#module-2-video-engine-apiv1videos)
   - [Module 3: Subscriptions (`/api/v1/subscriptions`)](#module-3-subscriptions-apiv1subscriptions)
   - [Module 4: Likes System (`/api/v1/likes`)](#module-4-likes-system-apiv1likes)
   - [Module 5: Comments (`/api/v1/comments`)](#module-5-comments-apiv1comments)
   - [Module 6: Playlists (`/api/v1/playlists`)](#module-6-playlists-apiv1playlists)
   - [Module 7: Community Tweets (`/api/v1/tweets`)](#module-7-community-tweets-apiv1tweets)
   - [Module 8: Creator Studio Dashboard (`/api/v1/dashboard`)](#module-8-creator-studio-dashboard-apiv1dashboard)
   - [Module 9: Health Check (`/api/v1/healthcheck`)](#module-9-health-check-apiv1healthcheck)
3. [UI/UX Design Architecture & Guidelines](#3-uiux-design-architecture--guidelines)
   - [Design Theme & Color Palette](#design-theme--color-palette)
   - [Typography & Visual Hierarchy](#typography--visual-hierarchy)
   - [Key Page Layouts & Component Tree](#key-page-layouts--component-tree)
   - [Interactive Micro-Animations & States](#interactive-micro-animations--states)
4. [Frontend Folder Structure (Recommended)](#4-frontend-folder-structure-recommended)
5. [Frontend State Management & Hooks Strategy](#5-frontend-state-management--hooks-strategy)

---

## 1. Network & Client Setup

### Base URL & Environment
* **Local Backend URL:** `http://localhost:3000/api/v1` (or `http://localhost:8000/api/v1` depending on your `.env` `PORT`)
* Configure this in your frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
# Or for Next.js:
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

### Authentication & Cookie Handling
* **Dual-Token System:** The backend issues both an **Access Token** (short-lived, 1 day) and a **Refresh Token** (long-lived, 7–10 days).
* **HTTP-Only Cookies:** Tokens are set as HTTP-only cookies by the server. 
* **Mandatory Setting:** You **MUST** set `withCredentials: true` in Axios or `credentials: 'include'` in Fetch for all requests so the browser automatically sends and stores authentication cookies across origins.

### Axios Instance with Auto-Token Refresh
Create an Axios client with an interceptor that automatically triggers `/users/refresh-token` if an API call returns `401 Unauthorized`, retrying the original request seamlessly without logging out the user:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
  withCredentials: true, // Crucial for receiving and sending cookies
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh access token using stored refresh token cookie
        await axios.post(
          `${api.defaults.baseURL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        // Retry original request with newly issued session
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or revoked - redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Standard API Response & Error Schema
Every backend response follows a strictly predictable schema.

#### Success Response (`ApiResponse`)
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Operation successful description",
  "success": true
}
```

#### Error Response (`ApiError`)
```json
{
  "success": false,
  "message": "Specific error explanation",
  "errors": []
}
```

---

## 2. Complete Route-by-Route API Reference (42 Endpoints)

---

### Module 1: Authentication & User Profile (`/api/v1/users`)

#### 1. Register User
* **Method & URL:** `POST /users/register`
* **Access:** Public
* **Content-Type:** `multipart/form-data`
* **Request Form Fields:**
  * `fullName` *(String, Required)*: e.g. `"John Doe"`
  * `userName` *(String, Required)*: e.g. `"johndoe"`
  * `email` *(String, Required)*: e.g. `"john@example.com"`
  * `password` *(String, Required)*: e.g. `"SecretPassword123"`
  * `avatar` *(File, Image, Required)*: Profile picture file
  * `coverImage` *(File, Image, Optional)*: Channel banner file
* **Response:** `201 Created` with sanitized User object.
* **Frontend UI Usage:** Sign Up modal / Register page with image drag-and-drop previews.

#### 2. Login User
* **Method & URL:** `POST /users/login`
* **Access:** Public
* **Content-Type:** `application/json`
* **Request Body:**
```json
{
  "email": "john@example.com", // OR "userName": "johndoe"
  "password": "SecretPassword123"
}
```
* **Response:** `200 OK`
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
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "message": "User logged in successfully",
  "success": true
}
```
* **Frontend UI Usage:** Login page/modal. Save user profile in your Global Auth Store (Zustand, Redux, or React Context).

#### 3. Logout User
* **Method & URL:** `POST /users/logout`
* **Access:** 🔒 Secured (Cookie or Bearer token)
* **Request:** No body required.
* **Response:** `200 OK` — Clears HTTP-only cookies on client browser.
* **Frontend UI Usage:** Header User Dropdown "Sign Out" button. Clear frontend auth state and navigate to `/`.

#### 4. Refresh Access Token
* **Method & URL:** `POST /users/refresh-token`
* **Access:** Public / Cookie-based
* **Request:** Automatically sends HTTP-only `refreshToken` cookie.
* **Response:** `200 OK` with fresh tokens and sanitized user.
* **Frontend UI Usage:** Automated via Axios response interceptor on 401 errors.

#### 5. Change Password
* **Method & URL:** `POST /users/change-password`
* **Access:** 🔒 Secured
* **Request Body:**
```json
{
  "oldPassword": "CurrentPassword123",
  "newPassword": "NewStrongPassword456"
}
```
* **Response:** `200 OK`
* **Frontend UI Usage:** Settings / Security tab.

#### 6. Get Current Authenticated User
* **Method & URL:** `GET /users/current-user`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with user details.
* **Frontend UI Usage:** App initialization / page reload hook to rehydrate logged-in session.

#### 7. Update Account Details (Name & Email)
* **Method & URL:** `PATCH /users/update-account`
* **Access:** 🔒 Secured
* **Request Body:**
```json
{
  "fullName": "John Jonathan Doe",
  "email": "newjohn@example.com"
}
```
* **Response:** `200 OK` with updated user object.
* **Frontend UI Usage:** Settings / Edit Profile screen.

#### 8. Update Profile Avatar
* **Method & URL:** `PATCH /users/update-avatar`
* **Access:** 🔒 Secured
* **Content-Type:** `multipart/form-data`
* **Files:** `avatar` (Image file)
* **Response:** `200 OK` with new Cloudinary avatar URL.
* **Frontend UI Usage:** Click-to-upload avatar button in User Settings or Channel Header.

#### 9. Update Channel Banner / Cover Image
* **Method & URL:** `PATCH /users/update-cover-image`
* **Access:** 🔒 Secured
* **Content-Type:** `multipart/form-data`
* **Files:** `coverImage` (Image file)
* **Response:** `200 OK` with new Cloudinary cover image URL.
* **Frontend UI Usage:** "Edit Banner" camera icon on Channel Profile page.

#### 10. Get Channel Profile
* **Method & URL:** `GET /users/c/:username`
* **Access:** 🔒 Secured
* **URL Param:** `:username` (e.g. `johndoe`)
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670868f1c841c9e8312a0011",
    "fullName": "Tech World",
    "userName": "techworld",
    "avatar": "https://res.cloudinary.com/.../avatar.jpg",
    "coverImage": "https://res.cloudinary.com/.../cover.jpg",
    "subscriberCount": 1540,
    "channelsSubscribedToCount": 42,
    "videoCount": 28,
    "isSubscribed": true
  },
  "message": "User channel profile fetched successfully",
  "success": true
}
```
* **Frontend UI Usage:** Channel header banner, channel title, subscriber count label, and "Subscribe / Subscribed" button state.

#### 11. Get User Watch History
* **Method & URL:** `GET /users/history`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with array of watched videos including creator channel details.
* **Frontend UI Usage:** Sidebar "History" page (`/feed/history`).

---

### Module 2: Video Engine (`/api/v1/videos`)

#### 1. Upload & Publish a Video
* **Method & URL:** `POST /videos`
* **Access:** 🔒 Secured
* **Content-Type:** `multipart/form-data`
* **Form Data Fields:**
  * `title` *(String, Required)*: Video title
  * `description` *(String, Required)*: Detailed video description
  * `videoFile` *(File, MP4/WebM/MKV, Required)*: Video file
  * `thumbnail` *(File, Image, Required)*: Thumbnail image file
* **Response:** `201 Created` with saved Video document.
* **Frontend UI Usage:** Creator Studio Upload Modal with upload progress bar (use `onUploadProgress` in Axios).

#### 2. Get All Videos (Paginated Feed & Search)
* **Method & URL:** `GET /videos`
* **Access:** Public
* **Query Parameters:**
  * `page` *(Number, Optional, Default: 1)*: Page number
  * `limit` *(Number, Optional, Default: 10)*: Cards per page
  * `query` *(String, Optional)*: Search keyword (searches title & description)
  * `sortBy` *(String, Optional, Default: "createdAt")*: Sort field (`views`, `createdAt`, `duration`)
  * `sortType` *(String, Optional, Default: "desc")*: Sort direction (`asc`, `desc`)
  * `userId` *(String, Optional)*: Filter videos published by specific channel
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "docs": [
      {
        "_id": "670870f2c841c9e8312a0099",
        "title": "Learn Node.js in 1 Hour",
        "description": "Full crash course...",
        "videoFile": "https://res.cloudinary.com/.../video.mp4",
        "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
        "duration": 3600,
        "views": 4200,
        "isPublished": true,
        "createdAt": "2026-10-12T12:00:00.000Z",
        "owner": {
          "_id": "670868f1c841c9e8312a0011",
          "fullName": "Tech World",
          "userName": "techworld",
          "avatar": "https://res.cloudinary.com/.../avatar.jpg"
        }
      }
    ],
    "totalDocs": 140,
    "limit": 10,
    "page": 1,
    "totalPages": 14,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "Videos fetched successfully",
  "success": true
}
```
* **Frontend UI Usage:** Home page video grid, Search results page (`/results?search_query=...`), Channel Videos tab.

#### 3. Get Single Video by ID
* **Method & URL:** `GET /videos/:videoId`
* **Access:** Public or Authenticated (Optional JWT)
* **URL Param:** `:videoId`
* **Features:** Automatically increments video views in DB and appends `videoId` to the viewer's `watchHistory` if logged in.
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "_id": "670870f2c841c9e8312a0099",
    "title": "Learn Node.js in 1 Hour",
    "description": "Full crash course...",
    "videoFile": "https://res.cloudinary.com/.../video.mp4",
    "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
    "duration": 3600,
    "views": 4201,
    "isPublished": true,
    "createdAt": "2026-10-12T12:00:00.000Z",
    "owner": {
      "_id": "670868f1c841c9e8312a0011",
      "fullName": "Tech World",
      "userName": "techworld",
      "avatar": "https://res.cloudinary.com/.../avatar.jpg",
      "subscribersCount": 1540,
      "isSubscribed": false
    },
    "likesCount": 240,
    "isLiked": true
  },
  "message": "Video fetched successfully",
  "success": true
}
```
* **Frontend UI Usage:** Video Watch page (`/watch/:videoId`).

#### 4. Update Video Details
* **Method & URL:** `PATCH /videos/:videoId`
* **Access:** 🔒 Secured (Owner only)
* **Content-Type:** `multipart/form-data` or `application/json`
* **Body / Form Fields:** `title` (optional), `description` (optional), `thumbnail` (file, optional)
* **Response:** `200 OK` with updated video document.
* **Frontend UI Usage:** Creator Studio Edit Video Modal.

#### 5. Delete Video
* **Method & URL:** `DELETE /videos/:videoId`
* **Access:** 🔒 Secured (Owner only)
* **Response:** `200 OK` — Removes video from database, unlinks media from Cloudinary, and cascades deletes likes and comments.
* **Frontend UI Usage:** Creator Studio Video Table "Delete" button.

#### 6. Toggle Video Publish Status
* **Method & URL:** `PATCH /videos/toggle/publish/:videoId`
* **Access:** 🔒 Secured (Owner only)
* **Response:** `200 OK` with `{ isPublished: true | false }`.
* **Frontend UI Usage:** Creator Studio Visibility Toggle Switch.

---

### Module 3: Subscriptions (`/api/v1/subscriptions`)

#### 1. Toggle Channel Subscription
* **Method & URL:** `POST /subscriptions/c/:channelId`
* **Access:** 🔒 Secured
* **URL Param:** `:channelId` (User `_id` of the creator)
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": { "subscribed": true }, // or false
  "message": "Subscribed successfully", // or "Unsubscribed successfully"
  "success": true
}
```
* **Frontend UI Usage:** "Subscribe" / "Subscribed" button on Watch Page and Channel Page. Implement with optimistic UI update.

#### 2. Get Channel Subscribers List
* **Method & URL:** `GET /subscriptions/c/:channelId`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with array of subscriber user profiles.
* **Frontend UI Usage:** Channel Community / Subscribers viewer.

#### 3. Get Subscribed Channels (Following)
* **Method & URL:** `GET /subscriptions/u/:subscriberId`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with array of channels followed by user and their latest uploaded video.
* **Frontend UI Usage:** Sidebar Subscriptions list, Subscriptions Feed page (`/feed/subscriptions`).

---

### Module 4: Likes System (`/api/v1/likes`)

#### 1. Toggle Like on Video
* **Method & URL:** `POST /likes/toggle/v/:videoId`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with `{ isLiked: true | false }`.
* **Frontend UI Usage:** Like button on the Watch Page.

#### 2. Toggle Like on Comment
* **Method & URL:** `POST /likes/toggle/c/:commentId`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with `{ isLiked: true | false }`.
* **Frontend UI Usage:** Thumbs-up button on video comments.

#### 3. Toggle Like on Community Tweet
* **Method & URL:** `POST /likes/toggle/t/:tweetId`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with `{ isLiked: true | false }`.
* **Frontend UI Usage:** Heart/Like button on Community tab posts.

#### 4. Get User Liked Videos
* **Method & URL:** `GET /likes/videos`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with array of video cards liked by the user.
* **Frontend UI Usage:** Sidebar "Liked Videos" page (`/feed/liked`).

---

### Module 5: Comments (`/api/v1/comments`)

#### 1. Get Comments for a Video
* **Method & URL:** `GET /comments/:videoId?page=1&limit=10`
* **Access:** Public or Authenticated
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "docs": [
      {
        "_id": "670875c1c841c9e8312a0201",
        "content": "Awesome explanation, thank you!",
        "createdAt": "2026-10-12T13:00:00.000Z",
        "owner": {
          "_id": "670868f1c841c9e8312a0011",
          "fullName": "Jane Smith",
          "userName": "janesmith",
          "avatar": "https://res.cloudinary.com/.../jane.jpg"
        },
        "likesCount": 15,
        "isLiked": false
      }
    ],
    "totalDocs": 45,
    "limit": 10,
    "page": 1,
    "totalPages": 5,
    "hasNextPage": true
  },
  "message": "Comments fetched successfully",
  "success": true
}
```
* **Frontend UI Usage:** Watch Page comment stream with infinite scroll.

#### 2. Add Comment on Video
* **Method & URL:** `POST /comments/:videoId`
* **Access:** 🔒 Secured
* **Request Body:** `{ "content": "Awesome explanation!" }`
* **Response:** `201 Created` with new comment document.
* **Frontend UI Usage:** Comment input box at top of comments section.

#### 3. Update Comment
* **Method & URL:** `PATCH /comments/c/:commentId`
* **Access:** 🔒 Secured (Author only)
* **Request Body:** `{ "content": "Updated comment text" }`
* **Response:** `200 OK` with updated comment.
* **Frontend UI Usage:** Comment three-dot menu -> "Edit".

#### 4. Delete Comment
* **Method & URL:** `DELETE /comments/c/:commentId`
* **Access:** 🔒 Secured (Author only)
* **Response:** `200 OK`
* **Frontend UI Usage:** Comment three-dot menu -> "Delete".

---

### Module 6: Playlists (`/api/v1/playlists`)

#### 1. Create Playlist
* **Method & URL:** `POST /playlists`
* **Access:** 🔒 Secured
* **Request Body:** `{ "name": "Frontend Tutorials", "description": "React, Next, and CSS" }`
* **Response:** `201 Created` with new playlist object.
* **Frontend UI Usage:** "Create Playlist" modal or Watch Page "Save to playlist" popup.

#### 2. Get Playlist by ID
* **Method & URL:** `GET /playlists/:playlistId`
* **Access:** Public
* **Response:** `200 OK` with populated playlist and list of all videos with their owners.
* **Frontend UI Usage:** Playlist detail view (`/playlist/:playlistId`).

#### 3. Update Playlist Details
* **Method & URL:** `PATCH /playlists/:playlistId`
* **Access:** 🔒 Secured (Owner only)
* **Request Body:** `{ "name": "New Name", "description": "New Description" }`
* **Response:** `200 OK`.
* **Frontend UI Usage:** Playlist header edit button.

#### 4. Delete Playlist
* **Method & URL:** `DELETE /playlists/:playlistId`
* **Access:** 🔒 Secured (Owner only)
* **Response:** `200 OK`.
* **Frontend UI Usage:** Playlist three-dot menu -> "Delete".

#### 5. Add Video to Playlist
* **Method & URL:** `PATCH /playlists/add/:videoId/:playlistId`
* **Access:** 🔒 Secured (Owner only)
* **Response:** `200 OK` with updated playlist.
* **Frontend UI Usage:** "Save to playlist" checklist modal.

#### 6. Remove Video from Playlist
* **Method & URL:** `PATCH /playlists/remove/:videoId/:playlistId`
* **Access:** 🔒 Secured (Owner only)
* **Response:** `200 OK` with updated playlist.
* **Frontend UI Usage:** Delete icon on playlist track card.

#### 7. Get All Playlists Created by a User
* **Method & URL:** `GET /playlists/user/:userId`
* **Access:** Public
* **Response:** `200 OK` with array of user playlists, video counts, and first video thumbnail as cover.
* **Frontend UI Usage:** Channel "Playlists" tab or User Library.

---

### Module 7: Community Tweets (`/api/v1/tweets`)

#### 1. Post a Community Tweet
* **Method & URL:** `POST /tweets`
* **Access:** 🔒 Secured
* **Request Body:** `{ "content": "Livestream starting this Friday at 6 PM!" }`
* **Response:** `201 Created` with tweet and populated author.
* **Frontend UI Usage:** Community tab post creator card.

#### 2. Get User's Tweets
* **Method & URL:** `GET /tweets/user/:userId`
* **Access:** Public
* **Response:** `200 OK` with tweets, author avatar/name, likes counts, and `isLiked` state.
* **Frontend UI Usage:** Channel Profile "Community" tab.

#### 3. Update Tweet
* **Method & URL:** `PATCH /tweets/:tweetId`
* **Access:** 🔒 Secured (Author only)
* **Request Body:** `{ "content": "Rescheduled to Saturday!" }`
* **Response:** `200 OK`.
* **Frontend UI Usage:** Tweet three-dot dropdown -> "Edit".

#### 4. Delete Tweet
* **Method & URL:** `DELETE /tweets/:tweetId`
* **Access:** 🔒 Secured (Author only)
* **Response:** `200 OK`.
* **Frontend UI Usage:** Tweet three-dot dropdown -> "Delete".

---

### Module 8: Creator Studio Dashboard (`/api/v1/dashboard`)

#### 1. Get Channel Overview Analytics
* **Method & URL:** `GET /dashboard/stats`
* **Access:** 🔒 Secured
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "totalVideoViews": 124500,
    "totalSubscribers": 1540,
    "totalVideos": 28,
    "totalLikes": 8900
  },
  "message": "Channel stats fetched successfully",
  "success": true
}
```
* **Frontend UI Usage:** Creator Studio Dashboard top KPI metrics cards.

#### 2. Get Creator's Studio Videos Table
* **Method & URL:** `GET /dashboard/videos`
* **Access:** 🔒 Secured
* **Response:** `200 OK` with array of all uploaded videos, publish toggle status, views, likes count, and comments count.
* **Frontend UI Usage:** Creator Studio Content Table (`/studio/content`).

---

### Module 9: Health Check (`/api/v1/healthcheck`)

#### 1. Health Status & Ping
* **Method & URL:** `GET /healthcheck`
* **Access:** Public
* **Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "status": "OK",
    "uptime": 1284.52,
    "timestamp": "2026-10-12T14:00:00.000Z",
    "database": "Connected"
  },
  "message": "Server is healthy and running smoothly",
  "success": true
}
```
* **Frontend UI Usage:** Connectivity banner or footer status badge.

---

## 3. UI/UX Design Architecture & Guidelines

### Design Theme & Color Palette
For a modern, premium YouTube experience, implement a curated dark mode palette with high contrast and smooth glassmorphism:

```css
:root {
  /* Dark Theme Tokens (Default) */
  --bg-primary: #0f0f0f;         /* Deep background */
  --bg-secondary: #1f1f1f;       /* Sidebar, card, and drawer background */
  --bg-elevated: #272727;        /* Hover states, pills, dropdowns */
  --bg-border: #383838;          /* Subtle dividing borders */
  
  --text-primary: #f1f1f1;        /* High-contrast readable headers */
  --text-secondary: #aaaaaa;      /* Subtitles, timestamps, metadata */
  --text-muted: #717171;          /* Disabled states, placeholders */
  
  --accent-red: #ff0000;          /* Brand YouTube Red */
  --accent-hover: #cc0000;        /* Hover Red */
  --accent-blue: #3ea6ff;         /* Verification badges, link highlights */
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-full: 9999px;
  --transition-smooth: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Typography & Visual Hierarchy
* **Font Family:** `Roboto`, `Inter`, or `Outfit` via Google Fonts.
* **Hierarchy:**
  * **Video Titles (Watch Page):** `20px` bold, line-height `1.3`.
  * **Video Card Titles (Feed):** `15px` semi-bold, 2-line clamp with ellipsis (`-webkit-line-clamp: 2`).
  * **Channel Names & Meta:** `13px` medium, secondary text color.
  * **Stat Badges / Duration Badges:** `12px` bold, black badge background with 80% opacity.

---

### Key Page Layouts & Component Tree

```
App
├── Navbar (Persistent Top Bar)
│   ├── Logo & Brand (with Red Play Icon)
│   ├── Search Bar (with Debounce, Clear Icon & Search Button)
│   └── Actions (Create Video Button, Notifications, Avatar Dropdown)
├── Sidebar (Collapsible Left Drawer)
│   ├── Primary Links (Home, Subscriptions)
│   ├── Library Links (History, Liked Videos, Your Videos, Playlists)
│   └── Subscriptions List (Avatars + Channel Names with Live indicator)
└── Main Content Container
    ├── Home Feed Page ("/")
    │   ├── Topic Filter Bar (Horizontal scrollable category pills)
    │   └── Video Card Grid (Responsive 1/2/3/4 column grid)
    ├── Watch Video Page ("/watch/:videoId")
    │   ├── Left Column (Player & Primary Info)
    │   │   ├── Custom Video Player (HTML5 / Video.js with duration, play/pause, quality)
    │   │   ├── Video Title & Engagement Bar (Channel Card, Subscribe Button, Like/Share Pills)
    │   │   ├── Collapsible Description Box
    │   │   └── Comment Section (Comment count, comment input, paginated comments list)
    │   └── Right Column (Related / Recommended Videos list)
    ├── Channel Page ("/c/:username")
    │   ├── Channel Banner Cover Image
    │   ├── Channel Header (Avatar, Full Name, @handle, Stats, Subscribe Button)
    │   ├── Tab Bar (Videos, Playlists, Community, About)
    │   └── Tab Content Panes
    ├── Creator Studio ("/studio")
    │   ├── KPI Stats Cards (Views, Subscribers, Total Videos, Total Likes)
    │   ├── Upload Video Trigger Modal
    │   └── Video Management Data Table (Publish toggle, edit, delete actions)
    └── Playlist Page ("/playlist/:playlistId")
        ├── Left Sidebar (Cover, title, description, play all button)
        └── Tracklist Table (Numbered video cards with drag or remove action)
```

---

### Interactive Micro-Animations & States

1. **Video Hover Previews:**
   * On desktop hover of a video card thumbnail for > 500ms, start a subtle zoom or display animated preview.
2. **Optimistic UI Updates:**
   * **Like Button:** When the user clicks Like, instantly increment the counter and turn the icon blue/red before the API response returns. If the API fails, revert the state and display a toast alert.
   * **Subscribe Button:** Instantly toggle from `"Subscribe"` to `"Subscribed"` and adjust channel count on click.
3. **Skeleton Loading Screens:**
   * Instead of blank spinners, render shimmering skeleton placeholders matching video card dimensions (`16:9` aspect ratio thumbnail + circular avatar + title bars) while fetching initial feeds.
4. **Infinite Scroll Pagination:**
   * Use an `IntersectionObserver` on a bottom sentinel element to fetch the next page (`?page=2`, `?page=3`) automatically when user reaches 80% scroll height.

---

## 4. Frontend Folder Structure (Recommended)

Here is a clean, scalable folder architecture for React (Vite) or Next.js:

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                # Logos, static badges, placeholders
│   ├── components/            # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── SkeletonCard.jsx
│   │   │   └── Avatar.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── video/
│   │   │   ├── VideoCard.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── VideoGrid.jsx
│   │   │   └── UploadModal.jsx
│   │   └── comment/
│   │       ├── CommentItem.jsx
│   │       └── CommentSection.jsx
│   ├── context/               # Global state contexts
│   │   ├── AuthContext.jsx    # User session, login, logout
│   │   └── ThemeContext.jsx   # Dark / Light theme toggle
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useDebounce.js     # Search bar query debouncing
│   │   └── useInfiniteScroll.js
│   ├── pages/                 # Route pages
│   │   ├── Home.jsx           # "/"
│   │   ├── Watch.jsx          # "/watch/:videoId"
│   │   ├── Channel.jsx        # "/c/:username"
│   │   ├── Studio.jsx         # "/studio"
│   │   ├── History.jsx        # "/feed/history"
│   │   ├── LikedVideos.jsx    # "/feed/liked"
│   │   ├── PlaylistView.jsx   # "/playlist/:playlistId"
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── services/              # API caller functions
│   │   ├── api.js             # Axios instance & interceptors
│   │   ├── authService.js
│   │   ├── videoService.js
│   │   ├── commentService.js
│   │   ├── likeService.js
│   │   └── playlistService.js
│   ├── utils/                 # Formatting helpers
│   │   ├── formatViews.js     # 1500 -> "1.5K views"
│   │   ├── formatDuration.js  # 245 -> "4:05"
│   │   └── timeAgo.js         # Date -> "3 days ago"
│   ├── App.jsx
│   ├── index.css              # Design tokens and utilities
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js
```

---

## 5. Frontend State Management & Hooks Strategy

### 1. `AuthContext.jsx` Example
```javascript
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user on first load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/users/current-user");
        setUser(response.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/users/login", credentials);
    setUser(response.data.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 2. Formatted Duration & View Count Utilities
Frontend components require instant human-readable formatting:

```javascript
// Format seconds to mm:ss or hh:mm:ss
export const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Format view counts: 14200 -> "14.2K views"
export const formatViews = (views = 0) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
};
```

---

## 🎯 Summary Checklist for Frontend Developers
- [x] Configure base Axios client with `withCredentials: true`
- [x] Add auto-refresh interceptor catching `401` errors
- [x] Rehydrate session via `GET /users/current-user` on app boot
- [x] Build responsive grid (`repeat(auto-fill, minmax(300px, 1fr))`)
- [x] Integrate HTML5 / Video.js video player with views incrementing on `GET /videos/:videoId`
- [x] Implement optimistic subscription & like toggle switches
- [x] Add infinite scroll on comment threads and feed pages
- [x] Implement multi-part video and image upload progress indicators
