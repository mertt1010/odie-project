/**
 * Service for handling domain-related API calls
 */

// Use proxy path for development
const API_BASE_URL = "/api";

const DomainService = {
  /**
   * Get all domains for the current user
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response with domains data
   */
  listDomains: async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/list_domains?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(userId);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching domains:", error);
      throw error;
    }
  },

  /**
   * Get all users for a specific domain
   * @param {string|number} domainId - The domain ID
   * @returns {Promise} - API response with users data
   */
  listUsersByDomain: async (domainId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/list_users_by_domain/${domainId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching users for domain ${domainId}:`, error);
      throw error;
    }
  },

  /**
   * Get all available departments
   * @returns {Promise} - API response with departments data
   */
  listDepartments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/list_departments`, {
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
      console.error("Error fetching departments:", error);
      throw error;
    }
  },
};

export default DomainService;
