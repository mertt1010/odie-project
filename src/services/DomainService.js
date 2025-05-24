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
   * Add a new domain
   * @param {Object} domainData - The domain data to create
   * @returns {Promise} - API response
   */
  addDomain: async (domainData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/add_domain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(domainData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding domain:", error);
      throw error;
    }
  },

  /**
   * Update an existing domain
   * @param {string|number} domainId - The domain ID
   * @param {Object} domainData - The updated domain data
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response
   */
  updateDomain: async (domainId, domainData, userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/update_domain/${domainId}?user_id=${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(domainData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating domain ${domainId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a domain
   * @param {string|number} domainId - The domain ID
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response
   */
  deleteDomain: async (domainId, userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/delete_domain/${domainId}?user_id=${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting domain ${domainId}:`, error);
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
