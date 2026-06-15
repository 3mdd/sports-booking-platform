const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_LENGTH = 50;
const ALLOWED_PHONE_CHARACTERS = /^[+\d\s\-()[\]]+$/;

export function getPhoneValidationError(
  value,
  { required = false, label = "Phone number" } = {}
) {
  const phoneNumber = String(value || "").trim();

  if (!phoneNumber) {
    return required ? `${label} is required.` : "";
  }

  if (phoneNumber.length > MAX_PHONE_LENGTH) {
    return `${label} must be ${MAX_PHONE_LENGTH} characters or fewer.`;
  }

  if (!ALLOWED_PHONE_CHARACTERS.test(phoneNumber)) {
    return `${label} can only contain digits, +, spaces, hyphens, and brackets.`;
  }

  const digitCount = (phoneNumber.match(/\d/g) || []).length;

  if (digitCount < MIN_PHONE_DIGITS) {
    return `${label} must contain at least ${MIN_PHONE_DIGITS} digits.`;
  }

  return "";
}
