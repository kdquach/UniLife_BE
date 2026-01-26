import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  checkMenuAvailability,
  getActiveMenuByCanteen,
} from "../modules/menu/menu.service.js";
import Canteen from "../modules/canteen/canteen.model.js";
import Product from "../modules/product/product.model.js";
import Menu from "../modules/menu/menu.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up 2 levels from src/scripts to root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const run = async () => {
  try {
    console.log("Connecting to DB...");
    const uri = process.env.MONGODB_URI;
    console.log("URI:", uri ? uri.substring(0, 15) + "..." : "UNDEFINED");

    await mongoose.connect(uri || "mongodb://localhost:27017/unilife");
    console.log("Connected to DB");

    console.log("--- Debugging Menu Data ---");

    // Find ALL canteens
    const canteens = await Canteen.find({});
    console.log(`Found ${canteens.length} total canteens.`);

    for (const canteen of canteens) {
      console.log(
        `\nChecking Canteen: ${canteen.name} (${canteen._id}) [Status: ${canteen.status}]`,
      );

      // 1. Get raw Active Menu via logic
      const menu = await getActiveMenuByCanteen(canteen._id);
      if (!menu) {
        console.log(
          "  -> No active Menu found for today via getActiveMenuByCanteen",
        );

        // Fallback: Check raw DB for ANY menu for this canteen
        const anyMenu = await Menu.findOne({ canteenId: canteen._id }).sort({
          date: -1,
        });
        if (anyMenu) {
          console.log("  -> Found a raw menu in DB:", {
            id: anyMenu._id,
            date: anyMenu.date,
            status: anyMenu.status,
            itemCount: anyMenu.items ? anyMenu.items.length : 0,
          });
          console.log("  -> Today is:", new Date());
        } else {
          console.log("  -> No menus found at all in DB for this canteen.");
        }
        continue;
      }

      console.log("  -> Found Active Menu:", {
        id: menu._id,
        date: menu.date,
        itemCount: menu.items.length,
      });

      // 2. Check Items in Menu
      if (menu.items.length > 0) {
        // Check all items
        for (const item of menu.items) {
          const productId = item.productId._id || item.productId;
          // Try to get product name if populated, otherwise lookup?
          // Populate is in getActiveMenuByCanteen so it should be there.
          const productName = item.productId.name || "Unknown Name";

          console.log(
            `  -> Testing availability for Item: ${productName} (${productId})`,
          );

          const isAvailable = await checkMenuAvailability(
            productId,
            canteen._id,
          );
          console.log(`     Result: ${isAvailable}`);

          if (!isAvailable) {
            console.log("     !!! MISMATCH DETECTED !!!");
          }
        }
      } else {
        console.log("  -> Menu is empty.");
      }
    }
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
