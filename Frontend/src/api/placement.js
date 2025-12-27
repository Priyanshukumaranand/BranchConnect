/**
 * API module for FastAPI Placement Pipeline integration.
 * Fetches placement data and statistics from the FastAPI backend.
 */

// FastAPI Placement Pipeline base URL (configurable via environment variable)
const FASTAPI_BASE_URL = process.env.REACT_APP_FASTAPI_BASE_URL || 'https://placement-pipeline.lemonglacier-3904d7f4.southeastasia.azurecontainerapps.io';

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
 * Get the configured FastAPI base URL.
 * Useful for debugging or displaying in UI.
 */
export const getFastApiBaseUrl = () => FASTAPI_BASE_URL;
