import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: String,
    avatar: String,
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Users', profileSchema);
