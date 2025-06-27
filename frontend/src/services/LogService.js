/**
 * Service for handling log-related API calls
 */

// Use proxy path for development - this avoids CORS issues
const API_BASE_URL = "/api";

const LogService = {
  /**
   * Get all logs for the current user
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response with logs data
   */
  getLogs: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs?user_id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching logs:", error);
      throw error;
    }
  },
};

export default LogService;
