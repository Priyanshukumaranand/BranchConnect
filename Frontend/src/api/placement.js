/**
 * API module for FastAPI Placement Pipeline integration.
 * Fetches placement data and statistics from the FastAPI backend.
 */

// FastAPI Placement Pipeline base URL (configurable via environment variable)
// FastAPI Placement Pipeline base URL (configurable via environment variable)
// In development, we use relative path to leverage package.json proxy to bypass CORS
const FASTAPI_BASE_URL = process.env.REACT_APP_FASTAPI_BASE_URL || (
    process.env.NODE_ENV === 'development'
        ? ''
        : 'https://placement-pipeline.lemonglacier-3904d7f4.southeastasia.azurecontainerapps.io'
);

/**
 * Fetch database statistics from FastAPI.
 * @param {Object} options - Fetch options
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<{emails_stored: number, placement_drives: number, unique_companies: string[]}>}
 */
export const fetchDbStats = async ({ signal } = {}) => {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/debug/db/stats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        signal,
    });

    if (!response.ok) {
        const error = new Error(`Failed to fetch DB stats: ${response.statusText}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Fetch all placement drives with full details.
 * @param {Object} options - Fetch options
 * @param {string} [options.batch] - Filter by batch (e.g., "2026")
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<{total: number, batch_filter: string|null, drives: Array}>}
 */
export const fetchAllDrivesDetailed = async ({ batch, signal } = {}) => {
    // Handle relative URLs (for proxy) vs absolute URLs
    const base = FASTAPI_BASE_URL || window.location.origin;
    const url = new URL(`${FASTAPI_BASE_URL}/api/v1/drives/all/detailed`, base);

    if (batch) url.searchParams.append('batch', batch);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        signal,
    });

    if (!response.ok) {
        const error = new Error(`Failed to fetch drives: ${response.statusText}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Fetch placement statistics summary.
 * @param {Object} options - Fetch options
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<{total_companies: number, by_batch: Object, by_status: Object, top_locations: Object, recent_companies: Array}>}
 */
export const fetchPlacementStats = async ({ signal } = {}) => {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/drives/stats/summary`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        signal,
    });

    if (!response.ok) {
        const error = new Error(`Failed to fetch placement stats: ${response.statusText}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Fetch filter options for the dashboard.
 * @param {Object} options - Fetch options
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @returns {Promise<{companies: Array, batches: Array, statuses: Array, drive_types: Array}>}
 */
export const fetchFilterOptions = async ({ signal } = {}) => {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/drives/filters/options`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        signal,
    });

    if (!response.ok) {
        const error = new Error(`Failed to fetch filter options: ${response.statusText}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Get the configured FastAPI base URL.
 * Useful for debugging or displaying in UI.
 */
export const getFastApiBaseUrl = () => FASTAPI_BASE_URL;
