import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadDirectory = path.resolve("public", "uploads", "contestants");
const imageTypes = [
  {
    extension: ".jpg",
    matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    extension: ".png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    extension: ".webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
];

export async function saveContestantImage(file) {
  if (!file) return null;
  const imageType = imageTypes.find((type) => type.matches(file.buffer));
  if (!imageType) {
    const error = new Error("The uploaded file is not a valid JPG, PNG, or WebP image.");
    error.code = "INVALID_CONTESTANT_IMAGE";
    throw error;
  }

  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}${imageType.extension}`;
  await writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: "wx" });
  return `/uploads/contestants/${filename}`;
}

export async function deleteContestantImage(imageUrl) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("/uploads/contestants/") ||
    path.basename(imageUrl) !== imageUrl.slice("/uploads/contestants/".length)
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
