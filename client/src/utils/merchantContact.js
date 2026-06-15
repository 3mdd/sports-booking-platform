export function getMerchantContact(facility) {
  const merchant = facility?.merchantProfile || {};
  const merchantUser = merchant.user || {};

  return {
    businessName: merchant.businessName || "Facility merchant",
    contactName: merchantUser.fullName || "",
    username: merchantUser.username || "",
    phoneNumber: merchant.businessPhone || merchantUser.phoneNumber || "",
    businessAddress: merchant.businessAddress || "",
  };
}
