/**
 * Service for detecting user's country based on IP address
 */

// Free IP geolocation service (you can replace with a paid service for better reliability)
const IP_GEOLOCATION_API = 'https://ipapi.co/json/';

// Alternative service as fallback
const IP_GEOLOCATION_API_FALLBACK = 'https://ip-api.com/json/';

// Mapping of country codes to country names (matching our CountrySelector)
const COUNTRY_CODE_TO_NAME = {
  'AF': 'Afghanistan',
  'AL': 'Albania',
  'DZ': 'Algeria',
  'AS': 'American Samoa',
  'AD': 'Andorra',
  'AO': 'Angola',
  'AI': 'Anguilla',
  'AQ': 'Antarctica',
  'AG': 'Antigua and Barbuda',
  'AR': 'Argentina',
  'AM': 'Armenia',
  'AW': 'Aruba',
  'AU': 'Australia',
  'AT': 'Austria',
  'AZ': 'Azerbaijan',
  'BS': 'Bahamas',
  'BH': 'Bahrain',
  'BD': 'Bangladesh',
  'BB': 'Barbados',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BZ': 'Belize',
  'BJ': 'Benin',
  'BM': 'Bermuda',
  'BT': 'Bhutan',
  'BO': 'Bolivia',
  'BA': 'Bosnia and Herzegovina',
  'BW': 'Botswana',
  'BV': 'Bouvet Island',
  'BR': 'Brazil',
  'IO': 'British Indian Ocean Territory',
  'BN': 'Brunei Darussalam',
  'BG': 'Bulgaria',
  'BF': 'Burkina Faso',
  'BI': 'Burundi',
  'KH': 'Cambodia',
  'CM': 'Cameroon',
  'CA': 'Canada',
  'CV': 'Cape Verde',
  'KY': 'Cayman Islands',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'CL': 'Chile',
  'CN': 'China',
  'CX': 'Christmas Island',
  'CC': 'Cocos (Keeling) Islands',
  'CO': 'Colombia',
  'KM': 'Comoros',
  'CG': 'Congo',
  'CD': 'Congo, Democratic Republic of the',
  'CK': 'Cook Islands',
  'CR': 'Costa Rica',
  'CI': 'Cote D\'Ivoire',
  'HR': 'Croatia',
  'CU': 'Cuba',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'DJ': 'Djibouti',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'EC': 'Ecuador',
  'EG': 'Egypt',
  'SV': 'El Salvador',
  'GQ': 'Equatorial Guinea',
  'ER': 'Eritrea',
  'EE': 'Estonia',
  'ET': 'Ethiopia',
  'FK': 'Falkland Islands (Malvinas)',
  'FO': 'Faroe Islands',
  'FJ': 'Fiji',
  'FI': 'Finland',
  'FR': 'France',
  'GF': 'French Guiana',
  'PF': 'French Polynesia',
  'TF': 'French Southern Territories',
  'GA': 'Gabon',
  'GM': 'Gambia',
  'GE': 'Georgia',
  'DE': 'Germany',
  'GH': 'Ghana',
  'GI': 'Gibraltar',
  'GR': 'Greece',
  'GL': 'Greenland',
  'GD': 'Grenada',
  'GP': 'Guadeloupe',
  'GU': 'Guam',
  'GT': 'Guatemala',
  'GG': 'Guernsey',
  'GN': 'Guinea',
  'GW': 'Guinea-Bissau',
  'GY': 'Guyana',
  'HT': 'Haiti',
  'HM': 'Heard Island and Mcdonald Islands',
  'VA': 'Holy See (Vatican City State)',
  'HN': 'Honduras',
  'HK': 'Hong Kong',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IN': 'India',
  'ID': 'Indonesia',
  'IR': 'Iran, Islamic Republic of',
  'IQ': 'Iraq',
  'IE': 'Ireland',
  'IM': 'Isle of Man',
  'IL': 'Israel',
  'IT': 'Italy',
  'JM': 'Jamaica',
  'JP': 'Japan',
  'JE': 'Jersey',
  'JO': 'Jordan',
  'KZ': 'Kazakhstan',
  'KE': 'Kenya',
  'KI': 'Kiribati',
  'KP': 'Korea, Democratic People\'s Republic of',
  'KR': 'Korea, Republic of',
  'KW': 'Kuwait',
  'KG': 'Kyrgyzstan',
  'LA': 'Lao People\'s Democratic Republic',
  'LV': 'Latvia',
  'LB': 'Lebanon',
  'LS': 'Lesotho',
  'LR': 'Liberia',
  'LY': 'Libyan Arab Jamahiriya',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MO': 'Macao',
  'MK': 'Macedonia, the Former Yugoslav Republic of',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MY': 'Malaysia',
  'MV': 'Maldives',
  'ML': 'Mali',
  'MT': 'Malta',
  'MH': 'Marshall Islands',
  'MQ': 'Martinique',
  'MR': 'Mauritania',
  'MU': 'Mauritius',
  'YT': 'Mayotte',
  'MX': 'Mexico',
  'FM': 'Micronesia, Federated States of',
  'MD': 'Moldova, Republic of',
  'MC': 'Monaco',
  'MN': 'Mongolia',
  'ME': 'Montenegro',
  'MS': 'Montserrat',
  'MA': 'Morocco',
  'MZ': 'Mozambique',
  'MM': 'Myanmar',
  'NA': 'Namibia',
  'NR': 'Nauru',
  'NP': 'Nepal',
  'NL': 'Netherlands',
  'AN': 'Netherlands Antilles',
  'NC': 'New Caledonia',
  'NZ': 'New Zealand',
  'NI': 'Nicaragua',
  'NE': 'Niger',
  'NG': 'Nigeria',
  'NU': 'Niue',
  'NF': 'Norfolk Island',
  'MP': 'Northern Mariana Islands',
  'NO': 'Norway',
  'OM': 'Oman',
  'PK': 'Pakistan',
  'PW': 'Palau',
  'PS': 'Palestinian Territory, Occupied',
  'PA': 'Panama',
  'PG': 'Papua New Guinea',
  'PY': 'Paraguay',
  'PE': 'Peru',
  'PH': 'Philippines',
  'PN': 'Pitcairn',
  'PL': 'Poland',
  'PT': 'Portugal',
  'PR': 'Puerto Rico',
  'QA': 'Qatar',
  'RE': 'Reunion',
  'RO': 'Romania',
  'RU': 'Russian Federation',
  'RW': 'Rwanda',
  'BL': 'Saint Barthelemy',
  'SH': 'Saint Helena',
  'KN': 'Saint Kitts and Nevis',
  'LC': 'Saint Lucia',
  'MF': 'Saint Martin',
  'PM': 'Saint Pierre and Miquelon',
  'VC': 'Saint Vincent and the Grenadines',
  'WS': 'Samoa',
  'SM': 'San Marino',
  'ST': 'Sao Tome and Principe',
  'SA': 'Saudi Arabia',
  'SN': 'Senegal',
  'RS': 'Serbia',
  'CS': 'Serbia and Montenegro',
  'SC': 'Seychelles',
  'SL': 'Sierra Leone',
  'SG': 'Singapore',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'SB': 'Solomon Islands',
  'SO': 'Somalia',
  'ZA': 'South Africa',
  'GS': 'South Georgia and the South Sandwich Islands',
  'ES': 'Spain',
  'LK': 'Sri Lanka',
  'SD': 'Sudan',
  'SR': 'Suriname',
  'SJ': 'Svalbard and Jan Mayen',
  'SZ': 'Swaziland',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'SY': 'Syrian Arab Republic',
  'TW': 'Taiwan, Province of China',
  'TJ': 'Tajikistan',
  'TZ': 'Tanzania, United Republic of',
  'TH': 'Thailand',
  'TL': 'Timor-Leste',
  'TG': 'Togo',
  'TK': 'Tokelau',
  'TO': 'Tonga',
  'TT': 'Trinidad and Tobago',
  'TN': 'Tunisia',
  'TR': 'Turkey',
  'TM': 'Turkmenistan',
  'TC': 'Turks and Caicos Islands',
  'TV': 'Tuvalu',
  'UG': 'Uganda',
  'UA': 'Ukraine',
  'AE': 'United Arab Emirates',
  'GB': 'United Kingdom',
  'US': 'United States',
  'UM': 'United States Minor Outlying Islands',
  'UY': 'Uruguay',
  'UZ': 'Uzbekistan',
  'VU': 'Vanuatu',
  'VE': 'Venezuela',
  'VN': 'Viet Nam',
  'VG': 'Virgin Islands, British',
  'VI': 'Virgin Islands, U.s.',
  'WF': 'Wallis and Futuna',
  'EH': 'Western Sahara',
  'YE': 'Yemen',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};

// Mapping of country codes to phone country codes
const COUNTRY_CODE_TO_PHONE_CODE = {
  'EG': '+20',
  'SA': '+966',
  'AE': '+971',
  'US': '+1',
  'GB': '+44',
  'FR': '+33',
  'DE': '+49',
  'IT': '+39',
  'ES': '+34',
  'NL': '+31',
  'BE': '+32',
  'CH': '+41',
  'AT': '+43',
  'SE': '+46',
  'NO': '+47',
  'DK': '+45',
  'FI': '+358',
  'PL': '+48',
  'CZ': '+420',
  'HU': '+36',
  'RO': '+40',
  'BG': '+359',
  'HR': '+385',
  'SI': '+386',
  'SK': '+421',
  'LT': '+370',
  'LV': '+371',
  'EE': '+372',
  'IE': '+353',
  'PT': '+351',
  'GR': '+30',
  'CY': '+357',
  'MT': '+356',
  'LU': '+352',
  'IS': '+354',
  'CA': '+1',
  'AU': '+61',
  'NZ': '+64',
  'JP': '+81',
  'KR': '+82',
  'CN': '+86',
  'IN': '+91',
  'TH': '+66',
  'SG': '+65',
  'MY': '+60',
  'ID': '+62',
  'PH': '+63',
  'VN': '+84',
  'BD': '+880',
  'PK': '+92',
  'LK': '+94',
  'NP': '+977',
  'BT': '+975',
  'MV': '+960',
  'AF': '+93',
  'IR': '+98',
  'IQ': '+964',
  'SY': '+963',
  'JO': '+962',
  'LB': '+961',
  'IL': '+972',
  'TR': '+90',
  'GE': '+995',
  'AM': '+374',
  'AZ': '+994',
  'RU': '+7',
  'KZ': '+7',
  'KG': '+996',
  'TJ': '+992',
  'TM': '+993',
  'UZ': '+998',
  'MN': '+976',
  'KP': '+850',
  'HK': '+852',
  'MO': '+853',
  'TW': '+886',
  'BR': '+55',
  'AR': '+54',
  'CL': '+56',
  'CO': '+57',
  'PE': '+51',
  'VE': '+58',
  'EC': '+593',
  'BO': '+591',
  'PY': '+595',
  'UY': '+598',
  'GY': '+592',
  'SR': '+597',
  'GF': '+594',
  'FK': '+500',
  'ZA': '+27',
  'NG': '+234',
  'KE': '+254',
  'ET': '+251',
  'UG': '+256',
  'TZ': '+255',
  'RW': '+250',
  'SS': '+211',
  'SD': '+249',
  'LY': '+218',
  'TN': '+216',
  'DZ': '+213',
  'MA': '+212',
  'EG': '+20',
  'SO': '+252',
  'DJ': '+253',
  'ER': '+291',
  'MW': '+265',
  'ZM': '+260',
  'ZW': '+263',
  'BW': '+267',
  'NA': '+264',
  'SZ': '+268',
  'LS': '+266',
  'MG': '+261',
  'MU': '+230',
  'SC': '+248',
  'KM': '+269',
  'YT': '+262',
  'RE': '+262',
  'MZ': '+258',
  'AO': '+244',
  'CD': '+243',
  'CG': '+242',
  'GA': '+241',
  'GQ': '+240',
  'ST': '+239',
  'CV': '+238',
  'GM': '+220',
  'SN': '+221',
  'ML': '+223',
  'BF': '+226',
  'CI': '+225',
  'GH': '+233',
  'TG': '+228',
  'BJ': '+229',
  'NE': '+227',
  'TD': '+235',
  'CF': '+236',
  'CM': '+237',
  'BI': '+257',
  'MW': '+265',
  'ZM': '+260',
  'ZW': '+263',
  'BW': '+267',
  'NA': '+264',
  'SZ': '+268',
  'LS': '+266',
  'MG': '+261',
  'MU': '+230',
  'SC': '+248',
  'KM': '+269',
  'YT': '+262',
  'RE': '+262',
  'MZ': '+258',
  'AO': '+244',
  'CD': '+243',
  'CG': '+242',
  'GA': '+241',
  'GQ': '+240',
  'ST': '+239',
  'CV': '+238',
  'GM': '+220',
  'SN': '+221',
  'ML': '+223',
  'BF': '+226',
  'CI': '+225',
  'GH': '+233',
  'TG': '+228',
  'BJ': '+229',
  'NE': '+227',
  'TD': '+235',
  'CF': '+236',
  'CM': '+237',
  'BI': '+257'
};

/**
 * Detect user's country based on IP address
 * @returns {Promise<{country: string, countryCode: string, phoneCode: string}>}
 */
export const detectCountry = async () => {
  try {
    // Try primary service first
    let response = await fetch(IP_GEOLOCATION_API);
    
    if (!response.ok) {
      // Fallback to secondary service
      response = await fetch(IP_GEOLOCATION_API_FALLBACK);
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation data');
    }
    
    const data = await response.json();
    
    // Handle different response formats
    let countryCode, country, city, region;
    
    if (data.country_code) {
      // ipapi.co format
      countryCode = data.country_code;
      country = data.country_name;
      city = data.city;
      region = data.region;
    } else if (data.countryCode) {
      // ip-api.com format
      countryCode = data.countryCode;
      country = data.country;
      city = data.city;
      region = data.regionName;
    } else {
      throw new Error('Invalid geolocation response format');
    }
    
    // Convert country code to full country name
    const fullCountryName = COUNTRY_CODE_TO_NAME[countryCode] || country;
    
    // Get phone code for the country
    const phoneCode = COUNTRY_CODE_TO_PHONE_CODE[countryCode] || '+1'; // Default to US if not found
    
    console.log('🌍 Country detected:', {
      country: fullCountryName,
      countryCode,
      phoneCode,
      city,
      region
    });
    
    return {
      country: fullCountryName,
      countryCode,
      phoneCode,
      city: city || '',
      region: region || ''
    };
    
  } catch (error) {
    console.error('Error detecting country:', error);
    
    // Return default values (Egypt) if detection fails
    return {
      country: 'Egypt',
      countryCode: 'EG',
      phoneCode: '+20',
      city: '',
      region: ''
    };
  }
};

/**
 * Get country info by country code
 * @param {string} countryCode - ISO country code (e.g., 'US', 'EG')
 * @returns {Object} Country information
 */
export const getCountryByCode = (countryCode) => {
  const countryName = COUNTRY_CODE_TO_NAME[countryCode];
  const phoneCode = COUNTRY_CODE_TO_PHONE_CODE[countryCode];
  
  return {
    country: countryName || 'Unknown',
    countryCode,
    phoneCode: phoneCode || '+1'
  };
};

/**
 * Get phone code by country name
 * @param {string} countryName - Full country name
 * @returns {string} Phone country code
 */
export const getPhoneCodeByCountry = (countryName) => {
  // Find country code by name
  const countryCode = Object.keys(COUNTRY_CODE_TO_NAME).find(
    code => COUNTRY_CODE_TO_NAME[code] === countryName
  );
  
  return countryCode ? COUNTRY_CODE_TO_PHONE_CODE[countryCode] : '+1';
};

export default {
  detectCountry,
  getCountryByCode,
  getPhoneCodeByCountry
};