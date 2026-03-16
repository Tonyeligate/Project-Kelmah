import React from 'react';
import { Helmet } from 'react-helmet-async';
import WorkerDirectoryExperience from '../../search/components/WorkerDirectoryExperience';

const WorkerSearchPage = () => {
  return (
    <WorkerDirectoryExperience
      variant="hirer"
      basePath="/hirer/find-talents"
      seoTitle="Find Talent | Kelmah"
      seoDescription="Search, compare, and shortlist skilled workers for your next job on Kelmah."
      showHero={false}
    />
  );
};

export default WorkerSearchPage;

