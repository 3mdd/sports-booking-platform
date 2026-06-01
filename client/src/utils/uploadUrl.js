const API_BASE_URL = "http://localhost:5000";

export function getUploadFileUrl(filePath) {
  if (!filePath) return "";

  const normalizedFilePath = String(filePath).replace(/\\/g, "/");

  if (/^(https?:|data:|blob:)/i.test(normalizedFilePath)) {
    return normalizedFilePath;
  }

  if (normalizedFilePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${normalizedFilePath}`;
  }

  if (normalizedFilePath.startsWith("uploads/")) {
    return `${API_BASE_URL}/${normalizedFilePath}`;
  }

  return normalizedFilePath;
}
