import { LEET } from './leet.js';

// Display and search metadata follow the actual conversion data range.
export const SUPPORTED_YEARS = Object.keys(LEET).map(Number).sort((a, b) => a - b);
export const FIRST_YEAR = SUPPORTED_YEARS[0];
export const LATEST_YEAR = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1];
export const YEAR_RANGE = `${FIRST_YEAR}~${LATEST_YEAR}`;
