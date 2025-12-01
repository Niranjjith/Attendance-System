import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads/profile-photos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp.extension
    const userId = req.user?.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter - only images (supports modern formats like HEIC)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;
  const allowedMime = /^image\/(jpeg|png|gif|webp|heic|heif|bmp)$/i;

  const extname = allowedExtensions.test(path.extname(file.originalname));
  const mimetype = allowedMime.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp, heic, bmp)"));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: fileFilter,
});

export const handleProfilePhotoUpload = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ msg: "Image is too large. Maximum size is 10 MB." });
    }

    return res.status(400).json({
      msg: err.message || "Failed to upload profile photo. Please try again."
    });
  });
};

export default upload;


