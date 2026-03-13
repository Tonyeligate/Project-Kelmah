export const getSortedUniqueJobs = (jobs = [], sortBy = 'relevance') => {
  const deduped = Array.from(
    new Map((jobs || []).map((job) => [job.id || job._id, job])).values(),
  );

  if (sortBy === 'budget_high') {
    deduped.sort((a, b) => {
      const bBudget = typeof b.budget === 'object' ? (b.budget.amount || b.budget.max || 0) : (b.budget || 0);
      const aBudget = typeof a.budget === 'object' ? (a.budget.amount || a.budget.max || 0) : (a.budget || 0);
      return bBudget - aBudget;
    });
  } else if (sortBy === 'budget_low') {
    deduped.sort((a, b) => {
      const aBudget = typeof a.budget === 'object' ? (a.budget.amount || a.budget.min || 0) : (a.budget || 0);
      const bBudget = typeof b.budget === 'object' ? (b.budget.amount || b.budget.min || 0) : (b.budget || 0);
      return aBudget - bBudget;
    });
  } else if (sortBy === 'newest') {
    deduped.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  }

  return deduped;
};
