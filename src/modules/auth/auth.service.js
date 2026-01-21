import User from "../user/user.model.js";
import { generateToken } from "../../utils/jwt.js";
import AppError from "../../utils/AppError.js";

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and token
 */
export const register = async (userData) => {
  const { name, email, password, role } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || "customer",
  });

  // Generate token
  const token = generateToken({ id: user._id });

  // Remove password from output
  user.password = undefined;

  return { user, token };
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} User and token
 */
export const login = async (credentials) => {
  const { email, password } = credentials;

  // Check if email and password provided
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  // Generate token
  const token = generateToken({ id: user._id });

  // Remove password from output
  user.password = undefined;

  return { user, token };
};
