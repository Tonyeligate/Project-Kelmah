import React from 'react';
import WorkerDirectoryExperience from '../components/WorkerDirectoryExperience';
import PageCanvas from '../../common/components/PageCanvas';

const SearchPage = () => (
  <PageCanvas
    disableContainer
    sx={{ pt: { xs: 1.5, md: 2.5 }, pb: { xs: 4, md: 6 }, overflowX: 'clip' }}
  >
    <WorkerDirectoryExperience
      variant="public"
      basePath="/find-talents"
      seoTitle="Find Skilled Workers in Ghana | Kelmah"
      seoDescription="Search for skilled workers by trade, location, experience, and availability. Find carpenters, plumbers, electricians, and more across Ghana."
    />
  </PageCanvas>
);

export default SearchPage;
