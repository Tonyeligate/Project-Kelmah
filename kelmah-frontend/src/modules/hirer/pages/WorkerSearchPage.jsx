import WorkerDirectoryExperience from '../../search/components/WorkerDirectoryExperience';
import PageCanvas from '../../common/components/PageCanvas';

const WorkerSearchPage = () => {
  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <WorkerDirectoryExperience
        variant="hirer"
        basePath="/hirer/find-talents"
        seoTitle="Find Talent | Kelmah"
        seoDescription="Search, compare, and shortlist skilled workers for your next job on Kelmah."
        showHero={false}
      />
    </PageCanvas>
  );
};

export default WorkerSearchPage;
