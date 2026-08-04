const assert = require("node:assert/strict");
const test = require("node:test");

function loadControllers(prismaMock) {
  const prismaPath = require.resolve("../src/lib/prisma");
  const adminControllerPath = require.resolve("../src/controllers/adminController");
  const facilityControllerPath = require.resolve(
    "../src/controllers/facilityController"
  );

  delete require.cache[adminControllerPath];
  delete require.cache[facilityControllerPath];
  delete require.cache[prismaPath];

  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: prismaMock,
  };

  return {
    adminController: require("../src/controllers/adminController"),
    facilityController: require("../src/controllers/facilityController"),
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createAdminFacility(overrides = {}) {
  return {
    id: 10,
    name: "Test Court",
    location: "Test Location",
    stateName: null,
    areaName: null,
    isActive: true,
    isSuspendedByAdmin: false,
    sportType: {
      id: 1,
      name: "Badminton",
    },
    merchantProfile: {
      id: 20,
      businessName: "Merchant Sports",
      businessPhone: null,
      approvalStatus: "APPROVED",
      user: {
        fullName: "Merchant User",
        username: "merchant",
        email: "merchant@example.com",
        phoneNumber: null,
        isActive: true,
      },
    },
    createdAt: new Date("2026-08-05T00:00:00.000Z"),
    ...overrides,
  };
}

function createExistingFacility(overrides = {}) {
  return {
    id: 10,
    merchantProfileId: 20,
    sportTypeId: 1,
    name: "Test Court",
    description: null,
    location: "Test Location",
    stateName: null,
    areaName: null,
    pricePerSlot: 25,
    isActive: false,
    isSuspendedByAdmin: false,
    createdAt: new Date("2026-08-05T00:00:00.000Z"),
    updatedAt: new Date("2026-08-05T00:00:00.000Z"),
    ...overrides,
  };
}

function createUpdatedMerchantFacility(existingFacility, data) {
  return {
    ...existingFacility,
    ...data,
    sportType: {
      id: existingFacility.sportTypeId,
      name: "Badminton",
    },
    merchantProfile: {
      id: existingFacility.merchantProfileId,
      businessName: "Merchant Sports",
      approvalStatus: "APPROVED",
      user: {
        fullName: "Merchant User",
        username: "merchant",
        phoneNumber: null,
        isActive: true,
      },
    },
    images: [],
  };
}

test("admin suspends a facility without changing merchant active status", async () => {
  let updateArgs;
  const prismaMock = {
    facility: {
      findUnique: async () => ({ id: 10 }),
      update: async (args) => {
        updateArgs = args;
        return createAdminFacility({
          isActive: true,
          isSuspendedByAdmin: args.data.isSuspendedByAdmin,
        });
      },
    },
  };
  const { adminController } = loadControllers(prismaMock);
  const response = createResponse();

  await adminController.deactivateFacility(
    {
      auth: { role: "ADMIN" },
      params: { facilityId: "10" },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(updateArgs.data, { isSuspendedByAdmin: true });
  assert.equal(response.body.facility.isActive, true);
  assert.equal(response.body.facility.isSuspendedByAdmin, true);
});

test("admin-suspended facilities are excluded from customer listing queries", async () => {
  let findManyArgs;
  const prismaMock = {
    facility: {
      findMany: async (args) => {
        findManyArgs = args;
        return [];
      },
    },
  };
  const { facilityController } = loadControllers(prismaMock);
  const response = createResponse();

  await facilityController.getAllFacilities(
    {
      query: { approvedOnly: "true" },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(findManyArgs.where.isActive, true);
  assert.equal(findManyArgs.where.isSuspendedByAdmin, false);
  assert.equal(findManyArgs.where.merchantProfile.approvalStatus, "APPROVED");
  assert.equal(findManyArgs.where.merchantProfile.user.isActive, true);
});

test("merchant cannot reactivate a suspended facility", async () => {
  let updateCalled = false;
  const existingFacility = createExistingFacility({
    isActive: false,
    isSuspendedByAdmin: true,
  });
  const prismaMock = {
    facility: {
      findUnique: async () => existingFacility,
      findMany: async () => [],
      update: async () => {
        updateCalled = true;
      },
    },
  };
  const { facilityController } = loadControllers(prismaMock);
  const response = createResponse();

  await facilityController.updateFacility(
    {
      params: { id: "10" },
      body: { isActive: true },
    },
    response
  );

  assert.equal(response.statusCode, 403);
  assert.equal(updateCalled, false);
  assert.equal(
    response.body.message,
    "This facility has been suspended by an administrator and cannot be reactivated by the merchant."
  );
});

test("merchant request attempting to modify admin suspension field is rejected", async () => {
  let updateCalled = false;
  const existingFacility = createExistingFacility({
    isActive: true,
    isSuspendedByAdmin: true,
  });
  const prismaMock = {
    facility: {
      findUnique: async () => existingFacility,
      update: async () => {
        updateCalled = true;
      },
    },
  };
  const { facilityController } = loadControllers(prismaMock);
  const response = createResponse();

  await facilityController.updateFacility(
    {
      params: { id: "10" },
      body: { isSuspendedByAdmin: false },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(updateCalled, false);
  assert.equal(
    response.body.message,
    "isSuspendedByAdmin can only be modified by an administrator"
  );
});

test("admin restores a suspended facility without changing merchant active status", async () => {
  let updateArgs;
  const prismaMock = {
    facility: {
      findUnique: async () => ({ id: 10 }),
      update: async (args) => {
        updateArgs = args;
        return createAdminFacility({
          isActive: false,
          isSuspendedByAdmin: args.data.isSuspendedByAdmin,
        });
      },
    },
  };
  const { adminController } = loadControllers(prismaMock);
  const response = createResponse();

  await adminController.activateFacility(
    {
      auth: { role: "ADMIN" },
      params: { facilityId: "10" },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(updateArgs.data, { isSuspendedByAdmin: false });
  assert.equal(response.body.facility.isActive, false);
  assert.equal(response.body.facility.isSuspendedByAdmin, false);
});

test("merchant can control normal active status after admin restoration", async () => {
  let updateArgs;
  const existingFacility = createExistingFacility({
    isActive: false,
    isSuspendedByAdmin: false,
  });
  const prismaMock = {
    facility: {
      findUnique: async () => existingFacility,
      findMany: async () => [],
      update: async (args) => {
        updateArgs = args;
        return createUpdatedMerchantFacility(existingFacility, args.data);
      },
    },
  };
  const { facilityController } = loadControllers(prismaMock);
  const response = createResponse();

  await facilityController.updateFacility(
    {
      params: { id: "10" },
      body: { isActive: true },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(updateArgs.data, { isActive: true });
  assert.equal(response.body.facility.isActive, true);
  assert.equal(response.body.facility.isSuspendedByAdmin, false);
});
