const multer = require("multer");
const path = require("path");
const fs = require("fs");

const paymentProofUploadPath = path.join(
  __dirname,
  "../../uploads/payment-proofs"
);
const facilityUploadPath = path.join(__dirname, "../../uploads/facilities");
const paymentQrUploadPath = path.join(__dirname, "../../uploads/payment-qr");

// Create folder if it does not exist
fs.mkdirSync(paymentProofUploadPath, { recursive: true });
fs.mkdirSync(facilityUploadPath, { recursive: true });
fs.mkdirSync(paymentQrUploadPath, { recursive: true });

const paymentProofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentProofUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-proof-${uniqueSuffix}${ext}`);
  },
});

const facilityPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, facilityUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `facility-photo-${uniqueSuffix}${ext}`);
  },
});

const paymentQrStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentQrUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `payment-qr-${uniqueSuffix}${ext}`);
  },
});

const paymentProofFileFilter = (req, file, cb) => {
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

const facilityPhotoFileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype =
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp";

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error("Only JPG, JPEG, PNG, and WEBP image files are allowed"));
};

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  fileFilter: paymentProofFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const facilityPhotoUpload = multer({
  storage: facilityPhotoStorage,
  fileFilter: facilityPhotoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const paymentQrUpload = multer({
  storage: paymentQrStorage,
  fileFilter: facilityPhotoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  paymentProofUpload,
  facilityPhotoUpload,
  paymentQrUpload,
};
