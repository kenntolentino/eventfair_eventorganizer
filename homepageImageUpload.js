import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("Choose a JPG, PNG, or WebP image."));
    }
    callback(null, true);
  },
});

export function homepageImageUpload(req, res, next) {
  upload.fields([
    { name: "heroImage", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();

    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Homepage images must be 5 MB or smaller."
      : error.message || "The homepage image could not be uploaded.";
    req.flash("error_msg", message);
    res.redirect("/admin/homepage");
  });
}
