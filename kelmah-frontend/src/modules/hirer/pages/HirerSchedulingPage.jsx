import SchedulingPage from '../../scheduling/pages/SchedulingPage';

const HirerSchedulingPage = () => (
  <SchedulingPage
    viewerRole="hirer"
    pageTitle="Hiring Schedule"
    pageSubtitle="Coordinate interviews, site visits, and kickoff calls with workers from one place."
    counterpartyLabel="Worker"
    searchHelperText="Search by job or worker, then switch between calendar, agenda, upcoming, or map views."
    searchPlaceholder="Search appointments by job or worker..."
  />
);

export default HirerSchedulingPage;
