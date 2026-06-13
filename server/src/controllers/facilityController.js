const prisma = require("../lib/prisma");
const fs = require("fs");
const path = require("path");
const {
  expireOldPendingBookings,
} = require("../services/bookingExpiryService");

const isOptionalString = (value) =>
  value === undefined || value === null || typeof value === "string";

const facilityImageOrderBy = [
  { isMain: "desc" },
  { createdAt: "asc" },
  { id: "asc" },
];
const facilityUploadDirectory = path.resolve(
  __dirname,
  "../../uploads/facilities"
);

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parseLocalDateTime(dateValue, timeValue) {
  const dateMatch = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(timeValue).match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

function getStartOfLocalDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);

  return date;
}

const createFacility = async (req, res) => {
  try {
    const {
      merchantProfileId,
      sportTypeId,
      name,
      description,
      location,
      stateName,
      areaName,
      pricePerSlot,
    } = req.body;

    if (
      !merchantProfileId ||
      !sportTypeId ||
      !name ||
      !location ||
      pricePerSlot === undefined
    ) {
      return res.status(400).json({
        message: "merchantProfileId, sportTypeId, name, location, and pricePerSlot are required",
      });
    }

    if (!isOptionalString(stateName) || !isOptionalString(areaName)) {
      return res.status(400).json({
        message: "stateName and areaName must be strings when provided",
      });
    }

    const merchantProfile = await prisma.merchantProfile.findUnique({
      where: { id: Number(merchantProfileId) },
    });

    if (!merchantProfile) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    if (merchantProfile.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        message: "Merchant account must be approved before creating facilities",
      });
    }

    const sportType = await prisma.sportType.findUnique({
      where: { id: Number(sportTypeId) },
    });

    if (!sportType) {
      return res.status(404).json({
        message: "Sport type not found",
      });
    }

    const facility = await prisma.facility.create({
      data: {
        merchantProfileId: Number(merchantProfileId),
        sportTypeId: Number(sportTypeId),
        name,
        description,
        location,
        stateName: String(stateName || "").trim() || null,
        areaName: String(areaName || "").trim() || null,
        pricePerSlot,
      },
    });

    return res.status(201).json({
      message: "Facility created successfully",
      facility,
    });
  } catch (error) {
    console.error("Create facility failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllFacilities = async (req, res) => {
  try {
    const approvedOnly = req.query.approvedOnly === "true";

    const facilities = await prisma.facility.findMany({
      where: approvedOnly
        ? {
            isActive: true,
            merchantProfile: {
              approvalStatus: "APPROVED",
              user: {
                isActive: true,
              },
            },
          }
        : undefined,
      include: {
        sportType: true,
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
            approvalStatus: true,
            user: {
              select: {
                isActive: true,
              },
            },
          },
        },
        images: {
          orderBy: facilityImageOrderBy,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Facilities fetched successfully",
      facilities,
    });
  } catch (error) {
    console.error("Fetch facilities failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getFacilityById = async (req, res) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id: Number(id) },
      include: {
        sportType: true,
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
            approvalStatus: true,
            user: {
              select: {
                isActive: true,
              },
            },
          },
        },
        images: {
          orderBy: facilityImageOrderBy,
        },
        timeSlots: true,
      },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    if (
      req.query.approvedOnly === "true" &&
      (!facility.isActive ||
        facility.merchantProfile.approvalStatus !== "APPROVED" ||
        !facility.merchantProfile.user.isActive)
    ) {
      return res.status(404).json({
        message: "Facility is not available",
      });
    }

    return res.status(200).json({
      message: "Facility fetched successfully",
      facility,
    });
  } catch (error) {
    console.error("Fetch facility by ID failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getSportTypes = async (req, res) => {
  try {
    const sportTypes = await prisma.sportType.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      message: "Sport types fetched successfully",
      sportTypes,
    });
  } catch (error) {
    console.error("Fetch sport types failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const uploadFacilityPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const facilityId = Number(id);

    if (!Number.isInteger(facilityId) || facilityId <= 0) {
      return res.status(400).json({
        message: "Valid facility ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Facility photo file is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        images: {
          orderBy: facilityImageOrderBy,
        },
      },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const imageUrl = `uploads/facilities/${req.file.filename}`;
    const currentMainImage =
      facility.images.find((image) => image.isMain) || facility.images[0];

    if (currentMainImage) {
      await prisma.facilityImage.update({
        where: {
          id: currentMainImage.id,
        },
        data: {
          imageUrl,
          isMain: true,
        },
      });
    } else {
      await prisma.facilityImage.create({
        data: {
          facilityId,
          imageUrl,
          isMain: true,
        },
      });
    }

    const updatedFacility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        sportType: true,
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
          },
        },
        images: {
          orderBy: facilityImageOrderBy,
        },
      },
    });

    return res.status(200).json({
      message: "Facility photo uploaded successfully",
      facility: updatedFacility,
    });
  } catch (error) {
    console.error("Upload facility photo failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const requireFacilityOwner = async (req, res, next) => {
  try {
    const facilityId = parsePositiveInteger(
      req.params.facilityId || req.params.id
    );
    const merchantProfileId = parsePositiveInteger(
      req.headers["x-merchant-profile-id"]
    );

    if (!facilityId) {
      return res.status(400).json({
        message: "Valid facility ID is required",
      });
    }

    if (!merchantProfileId) {
      return res.status(401).json({
        message: "Merchant profile ID is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        id: true,
        merchantProfileId: true,
      },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    if (facility.merchantProfileId !== merchantProfileId) {
      return res.status(403).json({
        message: "You can only manage images for your own facilities",
      });
    }

    return next();
  } catch (error) {
    console.error("Facility image ownership check failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getFacilityImages = async (req, res) => {
  try {
    const facilityId = parsePositiveInteger(req.params.facilityId);

    if (!facilityId) {
      return res.status(400).json({
        message: "Valid facility ID is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        id: true,
        images: {
          orderBy: facilityImageOrderBy,
        },
      },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    return res.status(200).json({
      message: "Facility images fetched successfully",
      images: facility.images,
    });
  } catch (error) {
    console.error("Fetch facility images failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const uploadFacilityImages = async (req, res) => {
  try {
    const facilityId = parsePositiveInteger(req.params.facilityId);

    if (!Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one facility image is required",
      });
    }

    const existingImages = await prisma.facilityImage.findMany({
      where: { facilityId },
      orderBy: facilityImageOrderBy,
    });
    const hasMainImage = existingImages.some((image) => image.isMain);
    const shouldSetFirstNewAsMain = existingImages.length === 0;

    await prisma.$transaction(async (tx) => {
      if (!hasMainImage && existingImages.length > 0) {
        await tx.facilityImage.update({
          where: { id: existingImages[0].id },
          data: { isMain: true },
        });
      }

      for (let index = 0; index < req.files.length; index += 1) {
        await tx.facilityImage.create({
          data: {
            facilityId,
            imageUrl: `uploads/facilities/${req.files[index].filename}`,
            isMain: shouldSetFirstNewAsMain && index === 0,
          },
        });
      }
    });

    const images = await prisma.facilityImage.findMany({
      where: { facilityId },
      orderBy: facilityImageOrderBy,
    });

    return res.status(201).json({
      message: `${req.files.length} facility image${
        req.files.length === 1 ? "" : "s"
      } uploaded successfully`,
      images,
    });
  } catch (error) {
    console.error("Upload facility images failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const setFacilityMainImage = async (req, res) => {
  try {
    const facilityId = parsePositiveInteger(req.params.facilityId);
    const imageId = parsePositiveInteger(req.params.imageId);

    if (!imageId) {
      return res.status(400).json({
        message: "Valid image ID is required",
      });
    }

    const image = await prisma.facilityImage.findFirst({
      where: {
        id: imageId,
        facilityId,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "Facility image not found",
      });
    }

    await prisma.$transaction([
      prisma.facilityImage.updateMany({
        where: { facilityId },
        data: { isMain: false },
      }),
      prisma.facilityImage.update({
        where: { id: imageId },
        data: { isMain: true },
      }),
    ]);

    const images = await prisma.facilityImage.findMany({
      where: { facilityId },
      orderBy: facilityImageOrderBy,
    });

    return res.status(200).json({
      message: "Main facility image updated successfully",
      images,
    });
  } catch (error) {
    console.error("Set main facility image failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteFacilityImage = async (req, res) => {
  try {
    const facilityId = parsePositiveInteger(req.params.facilityId);
    const imageId = parsePositiveInteger(req.params.imageId);

    if (!imageId) {
      return res.status(400).json({
        message: "Valid image ID is required",
      });
    }

    const image = await prisma.facilityImage.findFirst({
      where: {
        id: imageId,
        facilityId,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "Facility image not found",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.facilityImage.delete({
        where: { id: imageId },
      });

      const remainingMainImage = await tx.facilityImage.findFirst({
        where: {
          facilityId,
          isMain: true,
        },
      });

      if (!remainingMainImage) {
        const nextImage = await tx.facilityImage.findFirst({
          where: { facilityId },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });

        if (nextImage) {
          await tx.facilityImage.update({
            where: { id: nextImage.id },
            data: { isMain: true },
          });
        }
      }
    });

    const imageFilePath = path.resolve(
      facilityUploadDirectory,
      path.basename(image.imageUrl)
    );

    if (imageFilePath.startsWith(`${facilityUploadDirectory}${path.sep}`)) {
      fs.promises.unlink(imageFilePath).catch((fileError) => {
        if (fileError.code !== "ENOENT") {
          console.error("Delete facility image file failed:", fileError);
        }
      });
    }

    const images = await prisma.facilityImage.findMany({
      where: { facilityId },
      orderBy: facilityImageOrderBy,
    });

    return res.status(200).json({
      message: "Facility image deleted successfully",
      images,
    });
  } catch (error) {
    console.error("Delete facility image failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      location,
      stateName,
      areaName,
      sportTypeId,
      pricePerSlot,
      isActive,
    } = req.body;

    const facilityId = Number(id);

    if (!Number.isInteger(facilityId) || facilityId <= 0) {
      return res.status(400).json({
        message: "Valid facility ID is required",
      });
    }

    const existingFacility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!existingFacility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    if (!isOptionalString(stateName) || !isOptionalString(areaName)) {
      return res.status(400).json({
        message: "stateName and areaName must be strings when provided",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          message: "Facility name cannot be empty",
        });
      }

      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      const trimmedDescription = String(description || "").trim();
      updateData.description = trimmedDescription || null;
    }

    if (location !== undefined) {
      const trimmedLocation = String(location).trim();

      if (!trimmedLocation) {
        return res.status(400).json({
          message: "Facility location cannot be empty",
        });
      }

      updateData.location = trimmedLocation;
    }

    if (stateName !== undefined) {
      updateData.stateName = String(stateName || "").trim() || null;
    }

    if (areaName !== undefined) {
      updateData.areaName = String(areaName || "").trim() || null;
    }

    if (sportTypeId !== undefined) {
      const parsedSportTypeId = Number(sportTypeId);

      if (!Number.isInteger(parsedSportTypeId) || parsedSportTypeId <= 0) {
        return res.status(400).json({
          message: "Valid sport type is required",
        });
      }

      const sportType = await prisma.sportType.findUnique({
        where: { id: parsedSportTypeId },
      });

      if (!sportType) {
        return res.status(404).json({
          message: "Sport type not found",
        });
      }

      updateData.sportTypeId = parsedSportTypeId;
    }

    if (pricePerSlot !== undefined) {
      const parsedPricePerSlot = Number(pricePerSlot);

      if (!Number.isFinite(parsedPricePerSlot) || parsedPricePerSlot <= 0) {
        return res.status(400).json({
          message: "Price per slot must be a positive number",
        });
      }

      updateData.pricePerSlot = parsedPricePerSlot;
    }

    if (isActive !== undefined) {
      if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
      } else if (isActive === "true" || isActive === "false") {
        updateData.isActive = isActive === "true";
      } else {
        return res.status(400).json({
          message: "isActive must be true or false",
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No facility details provided to update",
      });
    }

    const updatedFacility = await prisma.facility.update({
      where: { id: facilityId },
      data: updateData,
      include: {
        sportType: true,
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
          },
        },
        images: {
          orderBy: facilityImageOrderBy,
        },
      },
    });

    return res.status(200).json({
      message: "Facility updated successfully",
      facility: updatedFacility,
    });
  } catch (error) {
    console.error("Update facility failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createTimeSlots = async (req, res) => {
  try {
    const { facilityId, date, startTime, endTime } = req.body;

    if (!facilityId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "facilityId, date, startTime, and endTime are required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const slots = [];
    const current = parseLocalDateTime(date, startTime);
    const end = parseLocalDateTime(date, endTime);

    if (!current || !end) {
      return res.status(400).json({
        message: "Valid date, startTime, and endTime values are required",
      });
    }

    const continuesNextDay = end <= current;

    if (continuesNextDay) {
      end.setDate(end.getDate() + 1);
    }

    const totalMinutes = (end.getTime() - current.getTime()) / (60 * 1000);

    if (totalMinutes % 30 !== 0) {
      return res.status(400).json({
        message: "Time range must divide evenly into 30-minute slots.",
      });
    }

    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      if (slotEnd > end) break;

      slots.push({
        facilityId: Number(facilityId),
        slotDate: getStartOfLocalDay(slotStart),
        startTime: slotStart,
        endTime: slotEnd,
      });

      current.setMinutes(current.getMinutes() + 30);
    }

    const duplicateSlots = await prisma.timeSlot.findMany({
      where: {
        facilityId: Number(facilityId),
        OR: slots.map((slot) => ({
          slotDate: slot.slotDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      },
    });

    const duplicateKeys = new Set(
      duplicateSlots.map(
        (slot) =>
          `${slot.slotDate.toISOString()}|${slot.startTime.toISOString()}|${slot.endTime.toISOString()}`
      )
    );
    const newSlots = slots.filter(
      (slot) =>
        !duplicateKeys.has(
          `${slot.slotDate.toISOString()}|${slot.startTime.toISOString()}|${slot.endTime.toISOString()}`
        )
    );

    if (newSlots.length === 0) {
      return res.status(409).json({
        message: "This time slot already exists for this facility and date.",
        duplicateCount: duplicateSlots.length,
      });
    }

    const createdSlots = await prisma.timeSlot.createMany({
      data: newSlots,
    });

    return res.status(201).json({
      message:
        duplicateSlots.length > 0
          ? "Time slots created successfully. Existing duplicates were skipped."
          : "Time slots created successfully",
      totalCreated: createdSlots.count,
      duplicateCount: duplicateSlots.length,
      continuesNextDay,
    });
  } catch (error) {
    console.error("Create time slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getFacilitySlotsByDate = async (req, res) => {
  try {
    const { facilityId, date, includeNextDay } = req.query;

    if (!facilityId || !date) {
      return res.status(400).json({
        message: "facilityId and date are required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    await expireOldPendingBookings();

    const slotDate = parseLocalDateTime(date, "00:00");

    if (!slotDate) {
      return res.status(400).json({
        message: "Valid date is required",
      });
    }

    const nextSlotDate = new Date(slotDate);
    nextSlotDate.setDate(nextSlotDate.getDate() + 1);
    const shouldIncludeNextDay = includeNextDay === "true";

    const fetchedSlots = await prisma.timeSlot.findMany({
      where: {
        facilityId: Number(facilityId),
        slotDate: shouldIncludeNextDay
          ? {
              in: [slotDate, nextSlotDate],
            }
          : slotDate,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const selectedDateSlots = fetchedSlots.filter(
      (slot) => new Date(slot.slotDate).getTime() === slotDate.getTime()
    );
    let slots = selectedDateSlots;

    if (shouldIncludeNextDay && selectedDateSlots.length > 0) {
      const nextDaySlots = fetchedSlots.filter(
        (slot) => new Date(slot.slotDate).getTime() === nextSlotDate.getTime()
      );
      const hasMidnightConnection = selectedDateSlots.some(
        (slot) => new Date(slot.endTime).getTime() === nextSlotDate.getTime()
      );

      if (hasMidnightConnection) {
        const continuationSlots = [];
        let expectedStartTime = nextSlotDate.getTime();

        for (const slot of nextDaySlots) {
          const slotStartTime = new Date(slot.startTime).getTime();

          if (slotStartTime !== expectedStartTime) {
            break;
          }

          continuationSlots.push(slot);
          expectedStartTime = new Date(slot.endTime).getTime();
        }

        slots = [...selectedDateSlots, ...continuationSlots].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      }
    }

    return res.status(200).json({
      message: "Facility slots fetched successfully",
      slots,
    });
  } catch (error) {
    console.error("Fetch facility slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const blockTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { blockReason } = req.body;

    const slot = await prisma.timeSlot.findUnique({
      where: { id: Number(slotId) },
    });

    if (!slot) {
      return res.status(404).json({
        message: "Time slot not found",
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        message: "Booked slots cannot be blocked.",
      });
    }

    const updatedSlot = await prisma.timeSlot.update({
      where: { id: Number(slotId) },
      data: {
        isBlocked: true,
        blockReason: blockReason || null,
      },
    });

    return res.status(200).json({
      message: "Time slot blocked successfully",
      slot: updatedSlot,
    });
  } catch (error) {
    console.error("Block time slot failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const unblockTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await prisma.timeSlot.findUnique({
      where: { id: Number(slotId) },
    });

    if (!slot) {
      return res.status(404).json({
        message: "Time slot not found",
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        message: "Booked slots cannot be unblocked from merchant blocking.",
      });
    }

    if (!slot.isBlocked) {
      return res.status(400).json({
        message: "Only manually blocked slots can be unblocked.",
      });
    }

    const updatedSlot = await prisma.timeSlot.update({
      where: { id: Number(slotId) },
      data: {
        isBlocked: false,
        blockReason: null,
      },
    });

    return res.status(200).json({
      message: "Time slot unblocked successfully",
      slot: updatedSlot,
    });
  } catch (error) {
    console.error("Unblock time slot failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const blockFacilityDaySlots = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date, blockReason } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const slotDate = new Date(`${date}T00:00:00`);

    const [skippedBookedCount, blockResult] = await prisma.$transaction([
      prisma.timeSlot.count({
        where: {
          facilityId: Number(facilityId),
          slotDate,
          isBooked: true,
        },
      }),
      prisma.timeSlot.updateMany({
        where: {
          facilityId: Number(facilityId),
          slotDate,
          isBooked: false,
          isBlocked: false,
        },
        data: {
          isBlocked: true,
          blockReason: blockReason || null,
        },
      }),
    ]);

    return res.status(200).json({
      message: "Available slots blocked successfully",
      blockedCount: blockResult.count,
      skippedBookedCount,
    });
  } catch (error) {
    console.error("Block facility day slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const unblockFacilityDaySlots = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const slotDate = new Date(`${date}T00:00:00`);

    const unblockResult = await prisma.timeSlot.updateMany({
      where: {
        facilityId: Number(facilityId),
        slotDate,
        isBooked: false,
        isBlocked: true,
      },
      data: {
        isBlocked: false,
        blockReason: null,
      },
    });

    return res.status(200).json({
      message: "Blocked slots unblocked successfully",
      unblockedCount: unblockResult.count,
    });
  } catch (error) {
    console.error("Unblock facility day slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  createFacility,
  getAllFacilities,
  getFacilityById,
  getSportTypes,
  uploadFacilityPhoto,
  requireFacilityOwner,
  getFacilityImages,
  uploadFacilityImages,
  setFacilityMainImage,
  deleteFacilityImage,
  updateFacility,
  createTimeSlots,
  getFacilitySlotsByDate,
  blockTimeSlot,
  unblockTimeSlot,
  blockFacilityDaySlots,
  unblockFacilityDaySlots,
};
