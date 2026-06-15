const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_LENGTH = 50;
const ALLOWED_PHONE_CHARACTERS = /^[+\d\s\-()[\]]+$/;

function validatePhoneNumber(value, { required = false } = {}) {
  const phoneNumber = String(value || "").trim();

  if (!phoneNumber) {
    return required ? "Phone number is required" : null;
  }

  if (phoneNumber.length > MAX_PHONE_LENGTH) {
    return `Phone number must be ${MAX_PHONE_LENGTH} characters or fewer`;
  }

  if (!ALLOWED_PHONE_CHARACTERS.test(phoneNumber)) {
    return "Phone number can only contain digits, +, spaces, hyphens, and brackets";
  }

  const digitCount = (phoneNumber.match(/\d/g) || []).length;

  if (digitCount < MIN_PHONE_DIGITS) {
    return `Phone number must contain at least ${MIN_PHONE_DIGITS} digits`;
  }

  return null;
}

module.exports = {
  validatePhoneNumber,
};
