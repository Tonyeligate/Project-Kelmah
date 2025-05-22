import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyApplicationsPage from '../../pages/MyApplications';

const MyApplications = () => {
  const navigate = useNavigate();

  return <MyApplicationsPage />;
};

export default MyApplications; 