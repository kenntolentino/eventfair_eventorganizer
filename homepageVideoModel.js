import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const HomepageVideo = sequelize.define(
  "HomepageVideo",
  {
    title: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    videoUrl: { type: DataTypes.STRING(2048), allowNull: false },
  },
  { tableName: "homepage_videos", paranoid: true }
);
