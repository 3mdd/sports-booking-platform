const AUTH_STORAGE_KEY = "eliteSportAuthUser";

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
}

export function isCustomer() {
  return getAuthUser()?.role === "CUSTOMER";
}

export function isMerchant() {
  return getAuthUser()?.role === "MERCHANT";
}
