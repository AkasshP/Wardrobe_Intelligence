// src/store/actions/bodyAnalysisActions.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/wardrobe';

const getAuthToken = () => localStorage.getItem('token') || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ========== Async Thunks ==========

export const uploadBodyImage = createAsyncThunk(
  'bodyAnalysis/uploadImage',
  async ({ file, userId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', userId);

      const token = getAuthToken();
      const response = await apiClient.post('/upload-body-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (response.data.success) return response.data;
      return rejectWithValue(response.data.error || 'Upload failed');
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to upload image');
    }
  }
);

export const checkAnalysisStatus = createAsyncThunk(
  'bodyAnalysis/checkStatus',
  async (analysisId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/analysis-status/${analysisId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to check analysis status');
    }
  }
);

export const fetchAnalysisHistory = createAsyncThunk(
  'bodyAnalysis/fetchHistory',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/analysis-history/${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch analysis history');
    }
  }
);

export const deleteAnalysis = createAsyncThunk(
  'bodyAnalysis/deleteAnalysis',
  async (analysisId, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/analysis/${analysisId}`);
      return { analysisId, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete analysis');
    }
  }
);

export const retryAnalysis = createAsyncThunk(
  'bodyAnalysis/retryAnalysis',
  async (analysisId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/analysis/${analysisId}/retry`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to retry analysis');
    }
  }
);

export const generateDressRecommendations = createAsyncThunk(
  'bodyAnalysis/generateRecommendations',
  async (
    { analysisId, sexinessPreference = 'high', recommendationLimit = 10 },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiClient.post(
        `/generate-recommendations/${analysisId}`,
        null,
        { params: { sexinessPreference, recommendationLimit } }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch recommendations');
    }
  }
);

// ========== Sync Actions ==========

// we store the actual File object outside Redux:
let selectedFileRef = null;

export const selectFile = (file) => (dispatch) => {
  const { setSelectedFile, clearSelectedFile } = require('../slices/bodyAnalysisSlice');
  if (!file) {
    selectedFileRef = null;
    return dispatch(clearSelectedFile());
  }
  if (!file.type.startsWith('image/')) {
    return alert('Please select an image file');
  }
  selectedFileRef = file;
  const previewUrl = URL.createObjectURL(file);
  dispatch(
    setSelectedFile({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: file.lastModified,
      previewUrl,
    })
  );
};

export const getSelectedFile = () => selectedFileRef;

export const resetAnalysisState = () => (dispatch) => {
  selectedFileRef = null;
  const { resetAnalysis } = require('../slices/bodyAnalysisSlice');
  dispatch(resetAnalysis());
};

export const clearAllErrors = () => (dispatch) => {
  const { clearErrors } = require('../slices/bodyAnalysisSlice');
  dispatch(clearErrors());
};

// Combined flow: upload + polling + history refresh
export const uploadAndAnalyze = (file, userId) => async (dispatch) => {
  // select file
  dispatch(selectFile(file));
  // upload
  const result = await dispatch(uploadBodyImage({ file, userId }));
  if (uploadBodyImage.fulfilled.match(result)) {
    const { setPolling } = require('../slices/bodyAnalysisSlice');
    dispatch(setPolling(true));
    const analysisId = result.payload.analysisId;
    // poll
    const interval = setInterval(async () => {
      const statusResult = await dispatch(checkAnalysisStatus(analysisId));
      if (
        checkAnalysisStatus.fulfilled.match(statusResult) &&
        ['COMPLETED', 'FAILED'].includes(statusResult.payload.status)
      ) {
        clearInterval(interval);
        dispatch(setPolling(false));
        dispatch(fetchAnalysisHistory(userId));
      }
    }, 2000);
    // timeout
    setTimeout(() => {
      clearInterval(interval);
      dispatch(require('../slices/bodyAnalysisSlice').setPolling(false));
    }, 60000);
  }
};
