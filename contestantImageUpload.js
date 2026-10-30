import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("Choose a JPG, PNG, or WebP image."));
    }
    callback(null, true);
  },
});

export function contestantImageUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Contestant images must be 5 MB or smaller."
      : error.message || "The contestant image could not be uploaded.";
    req.flash("error_msg", message);
    res.redirect(req.get("referer") || "/organizer/contestants");
  });
}
