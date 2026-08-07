export const QA_ROLE_CREDENTIALS = {
  admin: {
    roleName: 'Admin',
    email: 'admin@orderofkpi.org',
    password: process.env.QA_PASS_ADMIN || 'atlanta',
    allowedRoutes: ['/admin-dashboard', '/candidate-tracker', '/review-applications', '/chair-dashboard', '/member-portal'],
    forbiddenRoutes: []
  },
  chair: {
    roleName: 'Membership Committee Chair',
    email: 'james.haywood@orderofkpi.org',
    password: process.env.QA_PASS_CHAIR || '2012',
    allowedRoutes: ['/chair-dashboard', '/candidate-tracker', '/review-applications', '/gantt-chart'],
    forbiddenRoutes: ['/admin-dashboard']
  },
  committee: {
    roleName: 'Membership Committee Member',
    email: 'brian.johnson@orderofkpi.org',
    password: process.env.QA_PASS_COMMITTEE || 'atlanta',
    allowedRoutes: ['/candidate-tracker', '/review-applications', '/gantt-chart'],
    forbiddenRoutes: ['/admin-dashboard', '/chair-dashboard']
  },
  officer: {
    roleName: 'Officer',
    email: 'ishmeal.allensworth@orderofkpi.org',
    password: process.env.QA_PASS_OFFICER || 'atlanta',
    allowedRoutes: ['/candidate-tracker', '/review-applications', '/chair-dashboard', '/gantt-chart'],
    forbiddenRoutes: ['/admin-dashboard']
  },
  member: {
    roleName: 'Standard Member',
    email: 'dameone.ferguson@orderofkpi.org',
    password: process.env.QA_PASS_MEMBER || 'atlanta',
    allowedRoutes: ['/member-portal', '/gantt-chart', '/selection-voting'],
    forbiddenRoutes: ['/admin-dashboard', '/chair-dashboard', '/candidate-tracker']
  },
  applicant: {
    roleName: 'Applicant / Prospective Member',
    email: 'mabmykie1914@gmail.com',
    password: process.env.QA_PASS_APPLICANT || '7119',
    allowedRoutes: ['/applicant-portal', '/membership-application'],
    forbiddenRoutes: ['/admin-dashboard', '/chair-dashboard', '/candidate-tracker', '/member-portal']
  }
};
