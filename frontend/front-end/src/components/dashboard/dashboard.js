import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/actions/authActions';
import {
  uploadAndAnalyze,
  checkAnalysisStatus,
  fetchAnalysisHistory,
  selectFile,
  resetAnalysisState,
  clearAllErrors,
  getSelectedFile,
  generateDressRecommendations,
} from '../../store/actions/bodyAnalysisActions';

import {
  selectBodyAnalysis,
  selectUploadStatus,
  selectAnalysisResult,
  selectAnalysisHistory,
  selectIsProcessing,
} from '../../store/slices/bodyAnalysisSlice';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pollingInterval = useRef(null);

  // Auth state
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || 1;

  // Body analysis state
  const {
    previewUrl,
    uploadError,
    currentAnalysisId,
    analysisStatus,
    analysisError,
    isPolling,
  } = useSelector(selectBodyAnalysis);

  const uploadStatus = useSelector(selectUploadStatus);
  const analysisResult = useSelector(selectAnalysisResult);
  const analysisHistory = useSelector(selectAnalysisHistory);
  const isProcessing = useSelector(selectIsProcessing);

  // Load analysis history on mount
  useEffect(() => {
    dispatch(fetchAnalysisHistory(userId));
  }, [dispatch, userId]);

  // Poll for analysis status
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

  // When analysis completes, fetch dress recommendations
  useEffect(() => {
    if (analysisStatus === 'COMPLETED' && currentAnalysisId) {
      dispatch(
        generateDressRecommendations({
          analysisId: currentAnalysisId,
          sexinessPreference: 'high',
          recommendationLimit: 10,
        })
      );
    }
  }, [analysisStatus, currentAnalysisId, dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleFileSelect = (e) => {
    dispatch(selectFile(e.target.files[0]));
  };
  const handleDrop = (e) => {
    e.preventDefault();
    dispatch(selectFile(e.dataTransfer.files[0]));
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleUpload = () => {
    const file = getSelectedFile();
    if (file) {
      dispatch(uploadAndAnalyze(file, userId));
    }
  };

  const handleReset = () => dispatch(resetAnalysisState());

  const formatMeasurement = (value, unit = 'in') =>
    value ? `${value} ${unit}` : 'N/A';

  const renderMeasurements = (measurements) => {
    try {
      const parsed =
        typeof measurements === 'string'
          ? JSON.parse(measurements)
          : measurements;
      return Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <span className="text-gray-600 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}:
          </span>
          <span className="font-medium">{formatMeasurement(value)}</span>
        </div>
      ));
    } catch {
      return <p className="text-gray-500">Invalid measurements data</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Virtual Try-On Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome {user?.name || 'User'}! Upload your full-body photo to get
              started
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📸 Body Analysis</h2>

            {!currentAnalysisId ? (
              <div
                className="border-2 border-dashed p-8 text-center hover:border-blue-400"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploadStatus === 'uploading'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                      >
                        {uploadStatus === 'uploading'
                          ? 'Uploading...'
                          : 'Upload & Analyze'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-6xl mb-4">👤</div>
                    <p className="text-gray-600 mb-4">
                      Drag & drop photo or click to select
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <span className="px-6 py-3 bg-blue-600 text-white rounded-lg">
                        Select Photo
                      </span>
                    </label>
                  </>
                )}
              </div>
            ) : null}

            {(uploadError || analysisError) && (
              <div className="mt-4 p-4 bg-red-50 border-red-200 text-red-700">
                {uploadError || analysisError}
                <button
                  onClick={() => dispatch(clearAllErrors())}
                  className="ml-4 text-red-500"
                >
                  ✕
                </button>
              </div>
            )}

            {isProcessing && <p className="mt-6">Analyzing your photo...</p>}

            {analysisResult && analysisStatus === 'COMPLETED' && (
              <div className="mt-6">
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  Analysis Complete!
                </div>

                {/* Body Profile */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2">Body Profile</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Body Type</p>
                      <p className="font-medium capitalize">
                        {analysisResult.bodyType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Skin Tone</p>
                      <p className="font-medium capitalize">
                        {analysisResult.skinTone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Measurements */}
                {analysisResult.measurements && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-2">Measurements</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {renderMeasurements(analysisResult.measurements)}
                    </div>
                  </div>
                )}

                {/* Dress Recommendations */}
                <div className="bg-white p-6 rounded-lg shadow mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Dress Recommendations
                  </h3>
                  {analysisResult.recommendations?.length > 0 ? (
                    <ul className="space-y-3">
                      {analysisResult.recommendations.map((dress, idx) => (
                        <li
                          key={idx}
                          className="border p-3 rounded-lg flex justify-between"
                        >
                          <span className="font-medium">
                            {dress.dress_name}
                          </span>
                          <span>
                            {dress.compatibility_score}% | Sexiness:{' '}
                            {dress.sexiness_score}/10
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No recommendations available.</p>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Analyze Another Photo
                </button>
              </div>
            )}
          </div>

          {/* Right Column (How It Works, History, etc.) */}
          <div className="space-y-6">
            {/* How It Works */}
            {/* … keep your existing right column … */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
