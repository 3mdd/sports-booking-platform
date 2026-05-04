const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../../uploads/payment-proofs");

// Create folder if it does not exist
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-proof-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype =
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf";

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error("Only JPG, JPEG, PNG, and PDF files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = upload;