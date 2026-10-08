import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        // unique filename to avoid overwrite
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname + '-' + uniqueSuffix)
    }
})

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1000000 * 1000 // 1000MB limit
    }
})