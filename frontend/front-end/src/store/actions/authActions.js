// src/store/actions/authActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';

// API Base URL
const API_BASE_URL = 'http://localhost:8080/api/auth';

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.sub,
      role: payload.role || 'USER',
      exp: payload.exp,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Helper function to check token expiry
const isTokenExpired = (exp) => {
  const currentTime = Date.now() / 1000;
  return exp < currentTime;
};

// Login Action
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Login failed');
      }

      const data = await response.json();
      const userInfo = decodeToken(data.token);
      
      // Check if token is not expired
      if (isTokenExpired(userInfo.exp)) {
        throw new Error('Token expired');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      return {
        token: data.token,
        user: {
          email: userInfo.email,
          role: userInfo.role,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Register Action
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Registration failed');
      }

      const data = await response.json();
      const userInfo = decodeToken(data.token);
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      return {
        token: data.token,
        user: {
          email: userInfo.email,
          role: userInfo.role,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Refresh Token Action (for future use)
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const currentToken = auth.token;
      
      if (!currentToken) {
        throw new Error('No token available');
      }

      // This would be a refresh endpoint in your backend
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const userInfo = decodeToken(data.token);
      
      localStorage.setItem('token', data.token);
      
      return {
        token: data.token,
        user: {
          email: userInfo.email,
          role: userInfo.role,
        },
      };
    } catch (error) {
      // Clear invalid token
      localStorage.removeItem('token');
      return rejectWithValue(error.message);
    }
  }
);

// Logout Action
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Clear token from localStorage
      localStorage.removeItem('token');
      
      return {};
    } catch (error) {
      // Even if backend call fails, clear local storage
      localStorage.removeItem('token');
      return rejectWithValue(error.message);
    }
  }
);

// Initialize Auth Action (check existing token)
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { isInitialized: true };
      }

      const userInfo = decodeToken(token);
      
      // Check if token is expired
      if (isTokenExpired(userInfo.exp)) {
        localStorage.removeItem('token');
        throw new Error('Token expired');
      }

      return {
        token,
        user: {
          email: userInfo.email,
          role: userInfo.role,
        },
        isInitialized: true,
      };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.message);
    }
  }
);