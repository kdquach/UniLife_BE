import mongoose from "mongoose";

// Role Schema
const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
      enum: ["admin", "manager", "staff", "customer"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Permission Schema
const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Permission code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Role_Permission Schema (Many-to-Many)
const rolePermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: [true, "Permission ID is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate role-permission pairs
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

// User_Role Schema (Many-to-Many between User and Role)
const userRoleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
    },
  },
  {
    timestamps: true,
  },
);

userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

export const Role = mongoose.model("Role", roleSchema);
export const Permission = mongoose.model("Permission", permissionSchema);
export const RolePermission = mongoose.model(
  "RolePermission",
  rolePermissionSchema,
);
export const UserRole = mongoose.model("UserRole", userRoleSchema);
