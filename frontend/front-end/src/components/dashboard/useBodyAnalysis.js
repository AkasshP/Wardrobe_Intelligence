import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  uploadBodyImage,
  checkAnalysisStatus,
  fetchAnalysisHistory,
  selectFile,
  resetAnalysisState,
  clearAllErrors,
} from '../store/actions/bodyAnalysisActions';
import {
  selectBodyAnalysis,
  selectUploadStatus,
  selectAnalysisResult,
  selectAnalysisHistory,
  selectIsProcessing,
} from '../store/slices/bodyAnalysisSlice';

export const useBodyAnalysis = (userId) => {
  const dispatch = useDispatch();
  const pollingInterval = useRef(null);

  // Selectors
  const bodyAnalysis = useSelector(selectBodyAnalysis);
  const uploadStatus = useSelector(selectUploadStatus);
  const analysisResult = useSelector(selectAnalysisResult);
  const analysisHistory = useSelector(selectAnalysisHistory);
  const isProcessing = useSelector(selectIsProcessing);

  const {
    previewUrl,
    uploadError,
    currentAnalysisId,
    analysisStatus,
    analysisError,
    isPolling,
  } = bodyAnalysis;

  // Load history on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchAnalysisHistory(userId));
    }
  }, [dispatch, userId]);

  // Handle polling
  useEffect(() => {
    if (isPolling && currentAnalysisId) {
      pollingInterval.current = setInterval(() => {
        dispatch(checkAnalysisStatus(currentAnalysisId));
      }, 2000);
    } else {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [isPolling, currentAnalysisId, dispatch]);

  // Actions
  const selectFileHandler = (file) => {
    dispatch(selectFile(file));
  };

  const uploadImage = (file) => {
    if (file && userId) {
      dispatch(uploadBodyImage({ file, userId }));
    }
  };

  const reset = () => {
    dispatch(resetAnalysisState());
  };

  const clearAllErrorsHandler = () => {
    dispatch(clearAllErrors());
  };

  const refreshHistory = () => {
    if (userId) {
      dispatch(fetchAnalysisHistory(userId));
    }
  };

  return {
    // State
    previewUrl,
    uploadStatus,
    uploadError,
    currentAnalysisId,
    analysisStatus,
    analysisResult,
    analysisError,
    analysisHistory,
    isProcessing,
    isPolling,
    
    // Actions
    selectFile: selectFileHandler,
    uploadImage,
    reset,
    clearAllErrors: clearAllErrorsHandler,
    refreshHistory,
  };
};