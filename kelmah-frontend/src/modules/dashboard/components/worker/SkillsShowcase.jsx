import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ConstructionIcon from '@mui/icons-material/Construction';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import BoltIcon from '@mui/icons-material/Bolt';

const skillIcons = {
  Carpentry: <ConstructionIcon />,
  Plumbing: <PlumbingIcon />,
  Electrical: <BoltIcon />,
};

const SkillsShowcase = ({ skills = [] }) => {
  return (
    <DashboardCard title="My Skills Showcase">
      <Box>
        {skills.map((skill, index) => (
          <Tooltip
            key={index}
            title={skill.verified ? 'Verified Skill' : 'Not Verified'}
            arrow
          >
            <Chip
              icon={skillIcons[skill.name] || <ConstructionIcon />}
              label={skill.name}
              variant="outlined"
              sx={{
                mr: 1,
                mb: 1,
                fontWeight: 'bold',
                borderColor: skill.verified ? 'success.main' : 'warning.main',
                color: skill.verified ? 'success.main' : 'warning.main',
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
              avatar={skill.verified ? <VerifiedUserIcon /> : null}
            />
          </Tooltip>
        ))}
      </Box>
    </DashboardCard>
  );
};

SkillsShowcase.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      verified: PropTypes.bool,
    }),
  ),
};

export default SkillsShowcase;
