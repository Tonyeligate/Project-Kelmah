import React from 'react';
import Register from '../components/register/Register';
import AuthWrapper from '../components/common/AuthWrapper';

const RegisterPage = () => {
  return (
    <AuthWrapper>
      <Register />
    </AuthWrapper>
  );
};

export default RegisterPage;
