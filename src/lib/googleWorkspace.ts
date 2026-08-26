import { getAccessToken } from './googleAuth';

/**
 * Robust Google API fetch wrapper that prevents HTML 401 error page crashes
 */
export async function safeGoogleFetch(url: string, init?: RequestInit): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google authentication required. Please connect your Google account.');
  }

  const headers = new Headers(init?.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || errJson.message || 'Google Workspace service request failed. Please try again.');
    } else {
      const text = await response.text().catch(() => '');
      if (text.includes('That’s an error') || text.includes('<html>')) {
        throw new Error('Google Workspace session has expired. Please re-authenticate to continue.');
      }
      throw new Error('Unable to complete Google Workspace request. Please try again.');
    }
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

/**
 * Creates a new Google Meet space
 */
export async function createMeetSpace() {
  return safeGoogleFetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Creates a new Google Doc
 */
export async function createGoogleDoc(title: string = 'Untitled Document') {
  return safeGoogleFetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
}

/**
 * Creates a new Google Slide (Presentation)
 */
export async function createGoogleSlide(title: string = 'Untitled Presentation') {
  return safeGoogleFetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
}

/**
 * Creates a new Google Form
 */
export async function createGoogleForm(title: string = 'Untitled Form') {
  return safeGoogleFetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ info: { title } }),
  });
}

/**
 * Fetches Google Form structure and metadata
 */
export async function getGoogleForm(formId: string) {
  return safeGoogleFetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    method: 'GET',
  });
}

/**
 * Fetches Google Form responses
 */
export async function getGoogleFormResponses(formId: string) {
  return safeGoogleFetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    method: 'GET',
  });
}


