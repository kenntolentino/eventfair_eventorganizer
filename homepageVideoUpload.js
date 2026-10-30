import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import multer from "multer";
import path from "node:path";

const uploadDirectory = path.resolve("public", "uploads", "homepage-videos");
const videoTypes = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      mkdir(uploadDirectory, { recursive: true })
        .then(() => callback(null, uploadDirectory))
        .catch(callback);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${videoTypes[file.mimetype] || ".invalid"}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!videoTypes[file.mimetype] || videoTypes[file.mimetype] !== extension) {
      return callback(new Error("Choose an MP4 or WebM video file."));
    }
    callback(null, true);
  },
});

export function homepageVideoUpload(req, res, next) {
  upload.single("videoFile")(req, res, (error) => {
    if (!error) return next();

    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Homepage videos must be 100 MB or smaller."
      : error.message || "The homepage video could not be uploaded.";
    req.flash("error_msg", message);
    res.redirect("/admin/homepage");
  });
}
