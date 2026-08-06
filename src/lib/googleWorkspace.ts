import { getAccessToken } from './googleAuth';

/**
 * Creates a new Google Meet space
 */
export async function createMeetSpace() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create Meet space');
  }

  return response.json();
}

/**
 * Creates a new Google Doc
 */
export async function createGoogleDoc(title: string = 'Untitled Document') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) throw new Error('Failed to create Document');
  return response.json();
}

/**
 * Creates a new Google Slide (Presentation)
 */
export async function createGoogleSlide(title: string = 'Untitled Presentation') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) throw new Error('Failed to create Presentation');
  return response.json();
}

/**
 * Creates a new Google Form
 */
export async function createGoogleForm(title: string = 'Untitled Form') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ info: { title } }),
  });

  if (!response.ok) throw new Error('Failed to create Form');
  return response.json();
}

/**
 * Fetches Google Form structure and metadata
 */
export async function getGoogleForm(formId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch Google Form details. Check form ID and permissions.');
  return response.json();
}

/**
 * Fetches Google Form responses
 */
export async function getGoogleFormResponses(formId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch Google Form responses. Ensure you have forms.responses.readonly scope permission.');
  return response.json();
}

