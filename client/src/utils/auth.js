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
    role: String(user?.role || ""),
    customerProfileId: toProfileId(user?.customerProfileId),
    merchantProfileId: toProfileId(user?.merchantProfileId),
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

export function isCustomer() {
  return getAuthUser()?.role === "CUSTOMER";
}

export function isMerchant() {
  return getAuthUser()?.role === "MERCHANT";
}
