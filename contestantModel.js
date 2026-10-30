import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Contestant = sequelize.define(
  "Contestant",
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    contestantNumber: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    middleName: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true },
    organization: { type: DataTypes.STRING, allowNull: true },
    biography: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM("registered", "withdrawn", "disqualified"),
      allowNull: false,
      defaultValue: "registered",
    },
  },
  { tableName: "contestants" }
);
