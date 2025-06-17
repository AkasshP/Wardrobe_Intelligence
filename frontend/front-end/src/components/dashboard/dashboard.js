import React from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/actions/authActions'; // Adjust path as needed

function Dashboard() {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logout Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Wardrobe Intelligence!</h2>
          <p className="text-gray-600">You have successfully logged in.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;