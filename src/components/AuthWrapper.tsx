import React from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Simplified wrapper - no authentication required for local use
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {children}
    </div>
  );
};

export default AuthWrapper;