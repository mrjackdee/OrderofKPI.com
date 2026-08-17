/**
 * Live Google Sheet Roster Service
 * Dynamically fetches and parses the live KPI Google Sheet to determine
 * financial status and Intake Dean voter eligibility in real time.
 */

export interface GoogleSheetMemberRow {
  firstName: string;
  lastName: string;
  fullName: string;
  fy26Paid: boolean;
  fy27Paid: boolean; // Financial status for general portal features & general voting
  mipCert: boolean;
  personalEmail: string;
  phone: string;
  kpiEmail: string;
  notes: string;
  fy27MipEligible: boolean; // SPECIFIC EXCLUSIVE CRITERIA FOR INTAKE DEAN VOTING ONLY
  isDeanVoterEligible: boolean; // True ONLY for Intake Dean Voting process
  isEligibleVoter: boolean; // Alias maintained for Intake Dean Voting
}

export interface GoogleSheetRosterResponse {
  success: boolean;
  lastUpdated: string;
  members: GoogleSheetMemberRow[];
  eligibleVoters: string[]; // List of emails eligible EXCLUSIVELY for Intake Dean Voting
}

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1-IMvMUANALE3KC1UY46QwHpmdIeEM268ZXSCK_Amj3s/gviz/tq?tqx=out:csv';

export function parseCSVLine(line: string): string[] {
  const row: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  return row;
}

/**
 * Direct client-side parser for Google Sheet CSV fallback
 */
export async function fetchLiveGoogleSheetDirectly(): Promise<GoogleSheetRosterResponse> {
  const sheetRes = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!sheetRes.ok) {
    throw new Error('Failed to fetch Google Sheet CSV directly');
  }
  const csvText = await sheetRes.text();
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const members: GoogleSheetMemberRow[] = [];
  const eligibleVotersSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const firstName = cols[0] || '';
    const lastName = cols[1] || '';
    if (!firstName && !lastName) continue;

    const fy26Paid = (cols[2] || '').trim().toUpperCase() === 'TRUE';
    const fy27Paid = (cols[3] || '').trim().toUpperCase() === 'TRUE';
    const mipCert = (cols[4] || '').trim().toUpperCase() === 'TRUE';
    const personalEmail = cols[5] || '';
    const phone = cols[6] || '';
    const rawKpiEmail = cols[7] || '';
    const notes = cols[8] || '';
    const fy27MipEligible = (cols[9] || '').trim().toUpperCase() === 'YES';

    let canonicalKpiEmail = rawKpiEmail.toLowerCase().trim();
    if (!canonicalKpiEmail && firstName && lastName) {
      canonicalKpiEmail = `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}@orderofkpi.org`;
    }
    if (firstName.toLowerCase() === 'terrell' && lastName.toLowerCase() === 'singleton') {
      canonicalKpiEmail = 'terrell.singleton@orderofkpi.org';
    }

    const isEligibleVoter = fy27MipEligible;

    if (isEligibleVoter) {
      if (canonicalKpiEmail) {
        eligibleVotersSet.add(canonicalKpiEmail);
      }
      if (personalEmail) {
        eligibleVotersSet.add(personalEmail.toLowerCase().trim());
      }
    }

    members.push({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      fy26Paid,
      fy27Paid,
      mipCert,
      personalEmail,
      phone,
      kpiEmail: canonicalKpiEmail,
      notes,
      fy27MipEligible,
      isDeanVoterEligible: isEligibleVoter,
      isEligibleVoter
    });
  }

  // Add system admin and candidate test account to eligible set for administrative testing
  eligibleVotersSet.add('admin@orderofkpi.org');
  eligibleVotersSet.add('candidate@gmail.com');

  return {
    success: true,
    lastUpdated: new Date().toISOString(),
    members,
    eligibleVoters: Array.from(eligibleVotersSet)
  };
}

/**
 * Main fetcher: Tries API endpoint first, falls back to direct client-side CSV fetch
 */
export async function getLiveGoogleSheetRoster(): Promise<GoogleSheetRosterResponse> {
  try {
    const res = await fetch('/api/roster/google-sheet');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.eligibleVoters)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('API roster fetch failed, attempting direct Google Sheet fetch:', err);
  }

  return fetchLiveGoogleSheetDirectly();
}
