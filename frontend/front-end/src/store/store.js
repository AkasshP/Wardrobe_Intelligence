import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bodyAnalysisReducer from './slices/bodyAnalysisSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    bodyAnalysis: bodyAnalysisReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['bodyAnalysis.selectedFile'],
      },
    }),
});