// src/store/actionTypes.js

// Auth Action Types
export const AUTH_ACTION_TYPES = {
  // Login
  LOGIN_PENDING: 'auth/loginUser/pending',
  LOGIN_FULFILLED: 'auth/loginUser/fulfilled',
  LOGIN_REJECTED: 'auth/loginUser/rejected',
  
  // Register
  REGISTER_PENDING: 'auth/registerUser/pending',
  REGISTER_FULFILLED: 'auth/registerUser/fulfilled',
  REGISTER_REJECTED: 'auth/registerUser/rejected',
  
  // Logout
  LOGOUT_PENDING: 'auth/logoutUser/pending',
  LOGOUT_FULFILLED: 'auth/logoutUser/fulfilled',
  LOGOUT_REJECTED: 'auth/logoutUser/rejected',
  
  // Initialize
  INITIALIZE_PENDING: 'auth/initializeAuth/pending',
  INITIALIZE_FULFILLED: 'auth/initializeAuth/fulfilled',
  INITIALIZE_REJECTED: 'auth/initializeAuth/rejected',
  
  // Refresh Token
  REFRESH_PENDING: 'auth/refreshToken/pending',
  REFRESH_FULFILLED: 'auth/refreshToken/fulfilled',
  REFRESH_REJECTED: 'auth/refreshToken/rejected',
  
  // Synchronous actions
  CLEAR_ERROR: 'auth/clearError',
  CLEAR_AUTH_STATE: 'auth/clearAuthState',
  UPDATE_USER_PROFILE: 'auth/updateUserProfile',
};

// API Status Types
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// User Roles
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_EXISTS: 'Email already exists.',
  TOKEN_EXPIRED: 'Session expired. Please login again.',
  VALIDATION_ERROR: 'Please check your input.',
  SERVER_ERROR: 'Server error. Please try again later.',
};