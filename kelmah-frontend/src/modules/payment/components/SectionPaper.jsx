import React from 'react';
import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// SectionPaper: styled Paper with gold-accented gradient background
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  background: `linear-gradient(to right, #28313b, #485461, ${theme.palette.secondary.main})`,
  color: theme.palette.common.white,
  border: `2px solid ${theme.palette.secondary.main}`,
}));

export default SectionPaper;
