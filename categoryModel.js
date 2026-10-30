import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Category = sequelize.define(
  "Category",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  { tableName: "categories" }
);
