import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB.");
    const { Voucher } = await import("./src/modules/voucher/voucher.model.js");
    const res = await Voucher.deleteMany({ code: { $regex: "TEST_" } });
    console.log(`Deleted ${res.deletedCount} test vouchers.`);

    // Also delete any with specific code DEL_TEST_01, ACT_TEST_01, etc.
    const res2 = await Voucher.deleteMany({
      code: {
        $in: [
          "TEST_PCT_01",
          "TEST_FIX_01",
          "BAD_DATE",
          "DEL_TEST_01",
          "ACT_TEST_01",
        ],
      },
    });
    console.log(`Deleted ${res2.deletedCount} specific test vouchers.`);

    mongoose.disconnect();
    console.log("Done.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
