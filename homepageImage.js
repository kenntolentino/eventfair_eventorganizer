import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadDirectory = path.resolve("public", "uploads", "homepage");
const uploadPrefix = "/uploads/homepage/";
const imageTypes = [
  {
    extension: ".jpg",
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    extension: ".png",
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    extension: ".webp",
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
];

function getImageType(file) {
  return imageTypes.find(
    (type) => type.mimeType === file.mimetype && type.matches(file.buffer)
  );
}

export function homepageImageDataUrl(file) {
  const imageType = getImageType(file);
  if (!imageType) {
    const error = new Error("Choose a valid JPG, PNG, or WebP image.");
    error.code = "INVALID_HOMEPAGE_IMAGE";
    throw error;
  }
  return `data:${imageType.mimeType};base64,${file.buffer.toString("base64")}`;
}

export async function saveHomepageImage(file) {
  if (!file) return null;
  const imageType = getImageType(file);
  if (!imageType) {
    const error = new Error("Choose a valid JPG, PNG, or WebP image.");
    error.code = "INVALID_HOMEPAGE_IMAGE";
    throw error;
  }

  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}${imageType.extension}`;
  await writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: "wx" });
  return `${uploadPrefix}${filename}`;
}

export async function deleteHomepageImage(imageUrl) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith(uploadPrefix) ||
    path.basename(imageUrl) !== imageUrl.slice(uploadPrefix.length)
  ) {
    return;
  }

  const filename = path.basename(imageUrl);
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename)) return;

  try {
    await unlink(path.join(uploadDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
