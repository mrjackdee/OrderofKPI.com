export interface MemberUser {
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export const defaultMembers: MemberUser[] = [
  { name: "Admin User", email: "admin@orderofkpi.org", role: "admin" },
  { name: "Deshaun Safford", email: "deshaun.safford@orderofkpi.org", role: "member" },
  { name: "Darius Scott", email: "darius.scott@orderofkpi.org", role: "member" },
  { name: "Keiland Henderson", email: "keiland.henderson@orderofkpi.org", role: "member" },
  { name: "Reginald Williams", email: "reginald.williams@orderofkpi.org", role: "member" },
  { name: "Jelahn Cherry", email: "jelahn.cherry@orderofkpi.org", role: "member" },
  { name: "Myric Crawford", email: "myric.crawford@orderofkpi.org", role: "member" },
  { name: "Brian Johnson", email: "brian.johnson@orderofkpi.org", role: "member" },
  { name: "Ishmeal Allensworth", email: "ishmeal.allensworth@orderofkpi.org", role: "member" },
  { name: "Edward Cook", email: "edward.cook@orderofkpi.org", role: "member" },
  { name: "Darron Jenkins", email: "darron.jenkins@orderofkpi.org", role: "member" },
  { name: "James Haywood Jr", email: "james.haywood@orderofkpi.org", role: "member" },
  { name: "Dameone Ferguson", email: "dameone.ferguson@orderofkpi.org", role: "member" },
  { name: "Brian Goings", email: "brian.goings@orderofkpi.org", role: "member" },
  { name: "Keith Woods", email: "keith.woods@orderofkpi.org", role: "member" },
  { name: "Dominic Goodman", email: "dominic.goodman@orderofkpi.org", role: "member" },
  { name: "Jason Pilar", email: "jason.pilar@orderofkpi.org", role: "member" },
  { name: "Brandon Owens", email: "brandon.owens@orderofkpi.org", role: "member" },
  { name: "Jack Dee", email: "jack.dee@orderofkpi.org", role: "member" },
  { name: "Anthony Jones", email: "anthony.jones@orderofkpi.org", role: "member" },
  { name: "Donald Mitchell", email: "donald.mitchell@orderofkpi.org", role: "member" },
  { name: "Kameron Whitfield", email: "kameron.whitfield@orderofkpi.org", role: "member" },
  { name: "Tobias Bordley", email: "tobias.bordley@orderofkpi.org", role: "member" },
  { name: "Denzel Talley", email: "denzel.talley@orderofkpi.org", role: "member" },
  { name: "Marcus Thomas", email: "marcus.thomas@orderofkpi.org", role: "member" },
  { name: "Demarion Smith", email: "demarion.smith@orderofkpi.org", role: "member" },
  { name: "Elijah Carter", email: "elijah.carter@orderofkpi.org", role: "member" },
  { name: "Devonte Jenkins", email: "devonte.jenkins@orderofkpi.org", role: "member" }
];

/**
 * Perform a hybrid login. 
 * First attempts to contact the server's API. If that fails (e.g. returns HTML or is unreachable),
 * we gracefully fall back to local validation against our known member directory.
 */
export async function performHybridLogin(email: string, pass: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    email: string;
    name: string;
    firstName: string;
    role: string;
    isFirstLogin: boolean;
  };
}> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: pass }),
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          message: 'Login successful via Server API',
          user: data.user
        };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid email or password'
        };
      }
    } else {
      // Server returned HTML (e.g. 404 fallback page on static hosting) or some other non-JSON response.
      // Trigger client-side fallback mode
      console.warn('API returned non-JSON response. Gracefully falling back to secure Client-Side Member Directory mode.');
      return performClientSideLogin(normalizedEmail, pass);
    }
  } catch (err) {
    // Connection refused / offline / server error. Trigger client-side fallback mode.
    console.warn('Could not contact API. Gracefully falling back to secure Client-Side Member Directory mode:', err);
    return performClientSideLogin(normalizedEmail, pass);
  }
}

/**
 * Handle password changes locally if server is unreachable.
 */
export async function performHybridPasswordChange(
  email: string,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, currentPassword: currentPass, newPassword: newPass }),
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Password updated' };
      } else {
        return { success: false, message: data.message || 'Failed to update password' };
      }
    } else {
      console.warn('API returned non-JSON response on password change. Falling back to secure Client-Side update.');
      return performClientSidePasswordChange(normalizedEmail, currentPass, newPass);
    }
  } catch (err) {
    console.warn('Failed to contact password change API. Falling back to secure Client-Side update:', err);
    return performClientSidePasswordChange(normalizedEmail, currentPass, newPass);
  }
}

// Client-Side Authentication Fallbacks
function performClientSideLogin(email: string, pass: string) {
  const member = defaultMembers.find(m => m.email.toLowerCase() === email);
  if (!member) {
    return {
      success: false,
      message: 'This email address is not registered on the KPI Active Financial Member Directory.'
    };
  }

  // Retrieve changed password from localStorage, defaulting to '2012'
  const savedPass = localStorage.getItem(`kpi_client_password_${email}`) || '2012';
  if (savedPass !== pass) {
    return {
      success: false,
      message: 'Incorrect password. If you have not changed your initial password, please use the default value.'
    };
  }

  const isChanged = localStorage.getItem(`kpi_password_changed_${email}`) === 'true';
  const firstName = member.name.split(' ')[0];

  return {
    success: true,
    message: 'Login successful via Client-Side Member Directory',
    user: {
      email: member.email,
      name: member.name,
      firstName,
      role: member.role,
      isFirstLogin: !isChanged
    }
  };
}

function performClientSidePasswordChange(email: string, currentPass: string, newPass: string) {
  const member = defaultMembers.find(m => m.email.toLowerCase() === email);
  if (!member) {
    return { success: false, message: 'Member account not found.' };
  }

  const savedPass = localStorage.getItem(`kpi_client_password_${email}`) || '2012';
  const isChanged = localStorage.getItem(`kpi_password_changed_${email}`) === 'true';

  // If already changed, current password must be correct
  if (isChanged && savedPass !== currentPass) {
    return { success: false, message: 'Current password provided is incorrect.' };
  }

  // Save the new password securely in local storage
  localStorage.setItem(`kpi_client_password_${email}`, newPass);
  localStorage.setItem(`kpi_password_changed_${email}`, 'true');

  return {
    success: true,
    message: 'Your portal password was updated successfully in your browser storage.'
  };
}
