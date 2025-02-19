// Map of state names to their standardized forms
const STATE_MAPPING = {
    'alabama': 'Alabama',
    'alaska': 'Alaska',
    'arizona': 'Arizona',
    'arkansas': 'Arkansas',
    'california': 'California',
    'colorado': 'Colorado',
    'connecticut': 'Connecticut',
    'delaware': 'Delaware',
    'florida': 'Florida',
    'georgia': 'Georgia',
    'hawaii': 'Hawaii',
    'idaho': 'Idaho',
    'illinois': 'Illinois',
    'indiana': 'Indiana',
    'iowa': 'Iowa',
    'kansas': 'Kansas',
    'kentucky': 'Kentucky',
    'louisiana': 'Louisiana',
    'maine': 'Maine',
    'maryland': 'Maryland',
    'massachusetts': 'Massachusetts',
    'michigan': 'Michigan',
    'minnesota': 'Minnesota',
    'mississippi': 'Mississippi',
    'missouri': 'Missouri',
    'montana': 'Montana',
    'nebraska': 'Nebraska',
    'nevada': 'Nevada',
    'new hampshire': 'New Hampshire',
    'new jersey': 'New Jersey',
    'new mexico': 'New Mexico',
    'new york': 'New York',
    'north carolina': 'North Carolina',
    'north dakota': 'North Dakota',
    'ohio': 'Ohio',
    'oklahoma': 'Oklahoma',
    'oregon': 'Oregon',
    'pennsylvania': 'Pennsylvania',
    'rhode island': 'Rhode Island',
    'south carolina': 'South Carolina',
    'south dakota': 'South Dakota',
    'tennessee': 'Tennessee',
    'texas': 'Texas',
    'utah': 'Utah',
    'vermont': 'Vermont',
    'virginia': 'Virginia',
    'washington': 'Washington',
    'west virginia': 'West Virginia',
    'wisconsin': 'Wisconsin',
    'wyoming': 'Wyoming'
};

/**
 * Validate and normalize a state name
 * @param {string} state - The state name to validate
 * @returns {string|null} - The normalized state name or null if invalid
 */
export function validateState(state) {
    if (!state || typeof state !== 'string') {
        return null;
    }
    
    const normalizedState = state.toLowerCase().trim();
    return STATE_MAPPING[normalizedState] || null;
}

export { STATE_MAPPING };
