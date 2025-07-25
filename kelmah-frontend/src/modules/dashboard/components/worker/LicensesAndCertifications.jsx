import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const LicensesAndCertifications = ({ items = [] }) => {
  return (
    <DashboardCard title="Licenses & Certifications">
      <List dense>
        {items.map((item, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <WorkspacePremiumIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={`Issued by: ${item.issuer} - Expires: ${item.expiry}`}
            />
          </ListItem>
        ))}
      </List>
    </DashboardCard>
  );
};

LicensesAndCertifications.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      issuer: PropTypes.string.isRequired,
      expiry: PropTypes.string.isRequired,
    }),
  ),
};

export default LicensesAndCertifications;
