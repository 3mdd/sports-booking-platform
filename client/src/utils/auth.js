const AUTH_STORAGE_KEY = "eliteSportAuthUser";
export const AUTH_USER_UPDATED_EVENT = "eliteSportAuthUserUpdated";

function notifyAuthUserUpdated() {
  window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
}

function toProfileId(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function saveAuthUser(user) {
  const authUser = {
    userId: toProfileId(user?.userId ?? user?.id),
    fullName: String(user?.fullName || ""),
    email: String(user?.email || ""),
    phoneNumber: user?.phoneNumber ? String(user.phoneNumber) : null,
    avatarUrl: user?.avatarUrl ? String(user.avatarUrl) : null,
    role: String(user?.role || ""),
    isActive: user?.isActive !== false,
    customerProfileId: toProfileId(user?.customerProfileId),
    merchantProfileId: toProfileId(user?.merchantProfileId),
    merchantApprovalStatus: user?.merchantApprovalStatus
      ? String(user.merchantApprovalStatus)
      : null,
    merchantApprovalNote: user?.merchantApprovalNote
      ? String(user.merchantApprovalNote)
      : null,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
  notifyAuthUserUpdated();
  return authUser;
}

export function getAuthUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getCustomerProfileId() {
  const user = getAuthUser();

  return user?.role === "CUSTOMER"
    ? toProfileId(user.customerProfileId)
    : null;
}

export function getMerchantProfileId() {
  const user = getAuthUser();

  return user?.role === "MERCHANT"
    ? toProfileId(user.merchantProfileId)
    : null;
}

export function getMerchantApprovalStatus() {
  const user = getAuthUser();

  if (user?.role !== "MERCHANT") return null;

  // Sessions saved before merchant approval existed belong to existing demo merchants.
  return user.merchantApprovalStatus || "APPROVED";
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthUserUpdated();
}

export function updateStoredUserName(fullName) {
  const authUser = getAuthUser();
  const normalizedName = String(fullName || "").trim();

  if (!authUser || !normalizedName) {
    return null;
  }

  const updatedUser = {
    ...authUser,
    fullName: normalizedName,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
  notifyAuthUserUpdated();

  return updatedUser;
}

export function updateStoredAuthUser(updates) {
  const authUser = getAuthUser();

  if (!authUser) {
    return null;
  }

  return saveAuthUser({
    ...authUser,
    ...updates,
    userId: authUser.userId,
  });
}

export function isCustomer() {
  return getAuthUser()?.role === "CUSTOMER";
}

export function isMerchant() {
  return getAuthUser()?.role === "MERCHANT";
}

export function isAdmin() {
  return getAuthUser()?.role === "ADMIN";
}
