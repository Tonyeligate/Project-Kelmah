export const createQuestionBank = (skillName = 'your trade') => {
  const normalizedName =
    typeof skillName === 'string' && skillName.length
      ? skillName
      : 'your trade';

  return [
    {
      id: 1,
      type: 'multiple-choice',
      question: `Which safety check should be completed before starting ${normalizedName.toLowerCase()} work?`,
      options: [
        'Confirm all tools are calibrated',
        'Inspect personal protective equipment',
        'Review client payment history',
        'Send job completion report',
      ],
      correct: 1,
      explanation:
        'Personal protective equipment must be inspected before every task to stay compliant with safety standards.',
      difficulty: 'easy',
    },
    {
      id: 2,
      type: 'multiple-choice',
      question: `A client requests a premium outcome for ${normalizedName}. What is the best first step?`,
      options: [
        'Offer a discount immediately',
        'Document their objectives and constraints',
        'Source additional subcontractors',
        'Decline the job due to scope creep',
      ],
      correct: 1,
      explanation:
        'Capturing requirements clearly ensures expectations are aligned before work begins.',
      difficulty: 'medium',
    },
    {
      id: 3,
      type: 'true-false',
      question: `Quality assurance for ${normalizedName.toLowerCase()} is complete once the client pays in full.`,
      correct: false,
      explanation:
        'QA verifies workmanship against standards and client requirements, regardless of payment status.',
      difficulty: 'medium',
    },
  ];
};
