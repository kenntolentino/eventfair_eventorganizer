import {
  getHomepageContent,
  getHomepageOverview,
} from "../utils/homepageContent.js";
import { getHomepageVideos } from "../utils/homepageVideo.js";

export const homePage = async (_req, res) => {
  const [content, overview, videos] = await Promise.all([
    getHomepageContent(),
    getHomepageOverview(),
    getHomepageVideos(),
  ]);
  res.render("home", {
    title: `${content.brand.name} | ${content.brand.subtitle}`,
    content,
    homepageVideos: videos,
    ...overview,
  });
};
