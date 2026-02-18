import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductCategory from '../modules/productCategory/productCategory.model.js';
import IngredientCategory from '../modules/ingredientCategory/ingredientCategory.model.js';
import Canteen from '../modules/canteen/canteen.model.js';

dotenv.config();

/**
 * Script để migrate các categories cũ (không có canteenId) 
 * gán vào canteen đầu tiên trong DB
 */
const migrateCategoriesToCanteen = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy canteen đầu tiên
    const firstCanteen = await Canteen.findOne().sort({ createdAt: 1 });
    
    if (!firstCanteen) {
      console.log('❌ Không tìm thấy canteen nào trong database');
      process.exit(1);
    }

    console.log(`📍 Sử dụng canteen: ${firstCanteen.name} (${firstCanteen._id})`);

    // Migrate Product Categories
    const productCategoriesWithoutCanteen = await ProductCategory.find({
      $or: [
        { canteenId: { $exists: false } },
        { canteenId: null }
      ]
    });

    if (productCategoriesWithoutCanteen.length > 0) {
      console.log(`\n🔄 Đang migrate ${productCategoriesWithoutCanteen.length} product categories...`);
      
      const productResult = await ProductCategory.updateMany(
        {
          $or: [
            { canteenId: { $exists: false } },
            { canteenId: null }
          ]
        },
        {
          $set: { canteenId: firstCanteen._id }
        }
      );

      console.log(`✅ Đã update ${productResult.modifiedCount} product categories`);
    } else {
      console.log('\n✓ Tất cả product categories đã có canteenId');
    }

    // Migrate Ingredient Categories
    const ingredientCategoriesWithoutCanteen = await IngredientCategory.find({
      $or: [
        { canteenId: { $exists: false } },
        { canteenId: null }
      ]
    });

    if (ingredientCategoriesWithoutCanteen.length > 0) {
      console.log(`\n🔄 Đang migrate ${ingredientCategoriesWithoutCanteen.length} ingredient categories...`);
      
      const ingredientResult = await IngredientCategory.updateMany(
        {
          $or: [
            { canteenId: { $exists: false } },
            { canteenId: null }
          ]
        },
        {
          $set: { canteenId: firstCanteen._id }
        }
      );

      console.log(`✅ Đã update ${ingredientResult.modifiedCount} ingredient categories`);
    } else {
      console.log('\n✓ Tất cả ingredient categories đã có canteenId');
    }

    console.log('\n✅ Migration hoàn tất!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi khi migrate:', error);
    process.exit(1);
  }
};

migrateCategoriesToCanteen();
