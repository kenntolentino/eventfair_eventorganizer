import { HomepageVideo } from "../models/index.js";
import { plain } from "./view.js";
import { open, unlink } from "node:fs/promises";
import path from "node:path";

const uploadDirectory = path.resolve("public", "uploads", "homepage-videos");
const uploadPrefix = "/uploads/homepage-videos/";
const videoFilePattern = /^[0-9a-f-]{36}\.(mp4|webm)$/i;

export async function validateHomepageVideoFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedType = extension === ".mp4"
    ? { mimeType: "video/mp4", matches: (header) => header.toString("ascii", 4, 8) === "ftyp" }
    : extension === ".webm"
      ? { mimeType: "video/webm", matches: (header) => header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) }
      : null;

  if (
    !expectedType ||
    expectedType.mimeType !== file.mimetype ||
    path.basename(file.path) !== file.filename ||
    !videoFilePattern.test(file.filename)
  ) {
    return false;
  }

  const handle = await open(file.path, "r");
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return bytesRead >= 8 && expectedType.matches(header);
  } finally {
    await handle.close();
  }
}

export async function deleteHomepageVideoFile(videoUrl) {
  if (
    typeof videoUrl !== "string" ||
    !videoUrl.startsWith(uploadPrefix) ||
    path.basename(videoUrl) !== videoUrl.slice(uploadPrefix.length) ||
    !videoFilePattern.test(videoUrl.slice(uploadPrefix.length))
  ) {
    return;
  }

  try {
    await unlink(path.join(uploadDirectory, path.basename(videoUrl)));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function parseHomepageVideoUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  let videoId;
  let embedUrl;

  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
    videoId = url.pathname === "/watch"
      ? url.searchParams.get("v")
      : url.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || "")) return null;
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (["youtu.be", "www.youtu.be"].includes(host)) {
    videoId = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    if (!videoId) return null;
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    videoId = url.pathname.match(/^(?:\/video)?\/(\d+)\/?$/)?.[1];
    if (!videoId) return null;
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  } else {
    return null;
  }

  return { videoUrl: url.href, embedUrl };
}

export async function getHomepageVideos() {
  const records = await HomepageVideo.findAll({ order: [["createdAt", "DESC"]] });
  return plain(records).map((video) => {
    if (video.videoUrl.startsWith(uploadPrefix)) {
      const filename = video.videoUrl.slice(uploadPrefix.length);
      if (path.basename(video.videoUrl) !== filename || !videoFilePattern.test(filename)) {
        throw new Error(`Homepage video ${video.id} has an invalid uploaded file path.`);
      }
      return {
        ...video,
        fileUrl: video.videoUrl,
        mimeType: filename.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4",
      };
    }

    const parsedUrl = parseHomepageVideoUrl(video.videoUrl);
    if (!parsedUrl) {
      throw new Error(`Homepage video ${video.id} has an invalid video URL.`);
    }
    return { ...video, embedUrl: parsedUrl.embedUrl };
  });
}
