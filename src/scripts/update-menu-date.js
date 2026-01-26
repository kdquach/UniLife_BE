import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Menu from "../modules/menu/menu.model.js";
import Canteen from "../modules/canteen/canteen.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up 2 levels from src/scripts to root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const run = async () => {
  try {
    console.log("Connecting to DB...");
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri || "mongodb://localhost:27017/unilife");
    console.log("Connected to DB");

    console.log("--- Updating Menu Date ---");

    // Target specific canteen from previous debug: Canteen A - Khu A
    // Or just update ALL active menus to today to be sure

    const today = new Date();
    today.setHours(8, 0, 0, 0); // Set to morning 8 AM

    console.log(`Setting Menus to Date: ${today.toISOString()}`);

    const result = await Menu.updateMany(
      { status: "active" },
      { $set: { date: today } },
    );

    console.log(`Updated ${result.modifiedCount} menus to today's date.`);

    // Verify
    const menus = await Menu.find({ status: "active" }).limit(5);
    for (const m of menus) {
      console.log(`Menu ${m._id} date is now: ${m.date}`);
    }
  } catch (error) {
    console.error("Update Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
