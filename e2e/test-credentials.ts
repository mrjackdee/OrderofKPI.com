export const QA_ROLE_CREDENTIALS = {
  admin: {
    roleName: 'Admin QA Agent',
    email: 'qa.admin@orderofkpi.org',
    password: process.env.QA_PASS_ADMIN || 'KPI_QA_Admin2026!',
    allowedRoutes: ['/admin-dashboard', '/candidate-tracker', '/review-applications', '/chair-dashboard', '/member-portal'],
    forbiddenRoutes: []
  },
  chair: {
    roleName: 'Membership Committee Chair QA Agent',
    email: 'qa.chair@orderofkpi.org',
    password: process.env.QA_PASS_CHAIR || 'KPI_QA_Chair2026!',
    allowedRoutes: ['/chair-dashboard', '/candidate-tracker', '/review-applications', '/gantt-chart'],
    forbiddenRoutes: ['/admin-dashboard']
  },
  committee: {
    roleName: 'Membership Committee Member QA Agent',
    email: 'qa.committee@orderofkpi.org',
    password: process.env.QA_PASS_COMMITTEE || 'KPI_QA_Committee2026!',
    allowedRoutes: ['/candidate-tracker', '/review-applications', '/gantt-chart'],
    forbiddenRoutes: ['/admin-dashboard', '/chair-dashboard']
  },
  officer: {
    roleName: 'Officer QA Agent',
    email: 'qa.officer@orderofkpi.org',
    password: process.env.QA_PASS_OFFICER || 'KPI_QA_Officer2026!',
    allowedRoutes: ['/candidate-tracker', '/review-applications', '/chair-dashboard', '/gantt-chart'],
    forbiddenRoutes: ['/admin-dashboard']
  },
  member: {
    roleName: 'Standard Member QA Agent',
    email: 'qa.member@orderofkpi.org',
    password: process.env.QA_PASS_MEMBER || 'KPI_QA_Member2026!',
    allowedRoutes: ['/member-portal', '/gantt-chart', '/selection-voting'],
    forbiddenRoutes: ['/admin-dashboard', '/chair-dashboard', '/candidate-tracker']
  },
  applicant: {
    roleName: 'Applicant QA Agent',
    email: 'qa.applicant@orderofkpi.org',
    password: process.env.QA_PASS_APPLICANT || 'KPI_QA_Applicant2026!',
    allowedRoutes: ['/applicant-portal', '/membership-application'],
    forbiddenRoutes: ['/admin-dashboard', '/chair-dashboard', '/candidate-tracker', '/member-portal']
  }
};
