import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);

  const switchMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">👔</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wardrobe Intelligence</h1>
          <p className="text-gray-600">{isLogin ? 'Sign in to your account' : 'Create new account'}</p>
        </div>

        {/* Form Component */}
        {isLogin ? (
          <LoginForm switchMode={switchMode} />
        ) : (
          <RegisterForm switchMode={switchMode} />
        )}
      </div>
    </div>
  );
}

export default AuthForm;