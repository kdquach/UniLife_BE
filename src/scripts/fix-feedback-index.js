import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

/**
 * Script để sửa lỗi unique index trong Feedback model
 * Lỗi: Index cũ { userId: 1, orderId: 1 } chỉ cho phép 1 feedback/order
 * Sửa: Index mới { userId: 1, orderId: 1, productId: 1 } cho phép feedback nhiều sản phẩm/order
 */

const fixFeedbackIndex = async () => {
  try {
    console.log('🔌 Đang kết nối database...');
    await connectDB();

    const Feedback = mongoose.connection.collection('feedbacks');

    console.log('📋 Danh sách index hiện tại:');
    const indexes = await Feedback.indexes();
    indexes.forEach((index) => {
      console.log('  -', index.name, ':', JSON.stringify(index.key));
    });

    // Kiểm tra và xóa index cũ nếu tồn tại
    const oldIndexName = 'userId_1_orderId_1';
    const hasOldIndex = indexes.some((idx) => idx.name === oldIndexName);

    if (hasOldIndex) {
      console.log(`\n❌ Đang xóa index cũ: ${oldIndexName}`);
      await Feedback.dropIndex(oldIndexName);
      console.log('✅ Đã xóa index cũ thành công');
    } else {
      console.log(
        `\n✓ Index cũ ${oldIndexName} không tồn tại (có thể đã xóa rồi)`
      );
    }

    // Tạo index mới
    console.log('\n➕ Đang tạo index mới: userId_1_orderId_1_productId_1');
    await Feedback.createIndex(
      { userId: 1, orderId: 1, productId: 1 },
      { unique: true, name: 'userId_1_orderId_1_productId_1' }
    );
    console.log('✅ Đã tạo index mới thành công');

    console.log('\n📋 Danh sách index sau khi update:');
    const newIndexes = await Feedback.indexes();
    newIndexes.forEach((index) => {
      console.log('  -', index.name, ':', JSON.stringify(index.key));
    });

    console.log('\n🎉 Hoàn thành! Index đã được sửa thành công.');
    console.log(
      '👉 Bây giờ user có thể feedback nhiều sản phẩm khác nhau trong cùng 1 order.'
    );
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database.');
  }
};

fixFeedbackIndex();
