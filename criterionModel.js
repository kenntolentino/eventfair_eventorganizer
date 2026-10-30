import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Criterion = sequelize.define(
  "Criterion",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    weightPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    minScore: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    maxScore: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 100 },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  { tableName: "criteria" }
);
