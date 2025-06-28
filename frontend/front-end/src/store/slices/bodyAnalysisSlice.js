import { createSlice } from '@reduxjs/toolkit';
import {
  uploadBodyImage,
  checkAnalysisStatus,
  fetchAnalysisHistory,
  deleteAnalysis,
  retryAnalysis,
  generateDressRecommendations,   // ← import the new thunk
} from '../actions/bodyAnalysisActions';

// Initial state
const initialState = {
  // Upload state
  fileName: null,
  fileSize: null,
  fileType: null,
  lastModified: null,
  previewUrl: null,
  uploadStatus: 'idle',     // 'idle' | 'uploading' | 'success' | 'error'
  uploadError: null,

  // Analysis state
  currentAnalysisId: null,
  analysisStatus: null,     // 'PROCESSING' | 'COMPLETED' | 'FAILED'
  analysisResult: null,
  analysisError: null,

  // Recommendations state
  recommendations: [],      // new
  recommendationsStatus: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
  recommendationsError: null,     // new

  // History
  analysisHistory: [],
  historyLoading: false,
  historyError: null,

  // UI
  isPolling: false,
};

const bodyAnalysisSlice = createSlice({
  name: 'bodyAnalysis',
  initialState,
  reducers: {
    setSelectedFile(state, action) {
      state.fileName = action.payload.fileName;
      state.fileSize = action.payload.fileSize;
      state.fileType = action.payload.fileType;
      state.lastModified = action.payload.lastModified;
      state.previewUrl = action.payload.previewUrl;
      state.uploadError = null;
      state.analysisResult = null;
      state.recommendations = [];              // clear old recommendations
      state.recommendationsStatus = 'idle';
      state.recommendationsError = null;
    },
    clearSelectedFile(state) {
      state.fileName = null;
      state.fileSize = null;
      state.fileType = null;
      state.lastModified = null;
      state.previewUrl = null;
    },
    resetAnalysis(state) {
      // clear everything except history
      state.fileName = null;
      state.fileSize = null;
      state.fileType = null;
      state.lastModified = null;
      state.previewUrl = null;
      state.uploadStatus = 'idle';
      state.uploadError = null;
      state.currentAnalysisId = null;
      state.analysisStatus = null;
      state.analysisResult = null;
      state.analysisError = null;
      state.isPolling = false;

      // clear recommendations
      state.recommendations = [];
      state.recommendationsStatus = 'idle';
      state.recommendationsError = null;
    },
    setPolling(state, action) {
      state.isPolling = action.payload;
    },
    clearErrors(state) {
      state.uploadError = null;
      state.analysisError = null;
      state.historyError = null;
      state.recommendationsError = null;      // also clear rec errors
    },
  },
  extraReducers: (builder) => {
    // Upload
    builder
      .addCase(uploadBodyImage.pending, (state) => {
        state.uploadStatus = 'uploading';
        state.uploadError = null;
      })
      .addCase(uploadBodyImage.fulfilled, (state, action) => {
        state.uploadStatus = 'success';
        state.currentAnalysisId = action.payload.analysisId;
        state.analysisStatus = 'PROCESSING';
        state.fileName = null;
        state.fileSize = null;
        state.fileType = null;
        state.lastModified = null;
        state.previewUrl = null;
        state.isPolling = true;
      })
      .addCase(uploadBodyImage.rejected, (state, action) => {
        state.uploadStatus = 'error';
        state.uploadError = action.payload;
      });

    // Analysis status
    builder
      .addCase(checkAnalysisStatus.fulfilled, (state, action) => {
        state.analysisStatus = action.payload.status;
        if (action.payload.status === 'COMPLETED') {
          state.analysisResult = action.payload;
          state.isPolling = false;
        } else if (action.payload.status === 'FAILED') {
          state.analysisError = action.payload.errorMessage || 'Analysis failed';
          state.isPolling = false;
        }
      })
      .addCase(checkAnalysisStatus.rejected, (state, action) => {
        state.analysisError = action.payload;
        state.isPolling = false;
      });

    // History
    builder
      .addCase(fetchAnalysisHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchAnalysisHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.analysisHistory = action.payload;
      })
      .addCase(fetchAnalysisHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });

    // Delete
    builder.addCase(deleteAnalysis.fulfilled, (state, action) => {
      state.analysisHistory = state.analysisHistory.filter(
        (item) => item.analysisId !== action.payload.analysisId
      );
    });

    // Retry
    builder
      .addCase(retryAnalysis.pending, (state) => {
        state.uploadStatus = 'uploading';
        state.analysisError = null;
      })
      .addCase(retryAnalysis.fulfilled, (state, action) => {
        state.uploadStatus = 'success';
        state.currentAnalysisId = action.payload.analysisId;
        state.analysisStatus = 'PROCESSING';
        state.isPolling = true;
      })
      .addCase(retryAnalysis.rejected, (state, action) => {
        state.uploadStatus = 'error';
        state.analysisError = action.payload;
      });

    // **New: Recommendations**
    builder
      .addCase(generateDressRecommendations.pending, (state) => {
        state.recommendationsStatus = 'loading';
        state.recommendationsError = null;
      })
      .addCase(generateDressRecommendations.fulfilled, (state, action) => {
        state.recommendationsStatus = 'succeeded';
        state.recommendations = action.payload.recommendations || [];
      })
      .addCase(generateDressRecommendations.rejected, (state, action) => {
        state.recommendationsStatus = 'failed';
        state.recommendationsError = action.payload;
      });
  },
});

// Exports
export const {
  setSelectedFile,
  clearSelectedFile,
  resetAnalysis,
  setPolling,
  clearErrors,
} = bodyAnalysisSlice.actions;

// Selectors
export const selectBodyAnalysis = (state) => state.bodyAnalysis;
export const selectUploadStatus = (state) => state.bodyAnalysis.uploadStatus;
export const selectAnalysisResult = (state) => state.bodyAnalysis.analysisResult;
export const selectAnalysisHistory = (state) =>
  state.bodyAnalysis.analysisHistory;
export const selectIsProcessing = (state) =>
  state.bodyAnalysis.analysisStatus === 'PROCESSING';

// New selectors for recommendations
export const selectRecommendations = (state) =>
  state.bodyAnalysis.recommendations;
export const selectRecommendationsStatus = (state) =>
  state.bodyAnalysis.recommendationsStatus;
export const selectRecommendationsError = (state) =>
  state.bodyAnalysis.recommendationsError;

export default bodyAnalysisSlice.reducer;
