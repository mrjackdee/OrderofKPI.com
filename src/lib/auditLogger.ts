export const logPortalSectionAccess = (sectionName: string) => {
  const userEmail = sessionStorage.getItem('userEmail') || 'anonymous';
  const userName = sessionStorage.getItem('userName') || userEmail;

  fetch('/api/applications/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewer_email: userEmail,
      reviewer_name: userName,
      applicant_email: 'portal_system',
      applicant_name: sectionName,
      action: `ACCESSED_PORTAL_SECTION: ${sectionName}`
    })
  }).catch(err => console.warn('Portal audit log error:', err));
};
