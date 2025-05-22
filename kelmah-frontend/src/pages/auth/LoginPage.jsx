import React from 'react';
import Login from '../../components/auth/Login';
import AuthWrapper from '../../components/auth/AuthWrapper';

const LoginPage = () => {
  return (
    <AuthWrapper>
      <Login />
    </AuthWrapper>
  );
};

export default LoginPage; 