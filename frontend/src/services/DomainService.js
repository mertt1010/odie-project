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

  /**
   * Add a new user to a domain
   * @param {Object} userData - The user data to create
   * @param {string} createdBy - The user ID who is creating this user
   * @returns {Promise} - API response
   */
  addUser: async (userData, createdBy) => {
    try {
      const submitData = {
        ...userData,
        created_by: createdBy,
      };

      const response = await fetch(`${API_BASE_URL}/add_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  },

  /**
   * Enable a user in a domain
   * @param {string} username - The username to enable
   * @param {number} domainId - The domain ID
   * @param {string} userId - The user ID performing this action
   * @returns {Promise} - API response
   */
  enableUser: async (username, domainId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/enable_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          domain_id: domainId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error enabling user:", error);
      throw error;
    }
  },

  /**
   * Disable a user in a domain
   * @param {string} username - The username to disable
   * @param {number} domainId - The domain ID
   * @param {string} userId - The user ID performing this action
   * @returns {Promise} - API response
   */
  disableUser: async (username, domainId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/disable_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          domain_id: domainId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error disabling user:", error);
      throw error;
    }
  },

  /**
   * Update an existing user
   * @param {number} domainId - The domain ID
   * @param {string} username - The username to update
   * @param {Object} userData - The updated user data
   * @param {string} userId - The user ID performing this action
   * @returns {Promise} - API response
   */
  updateUser: async (domainId, username, userData, userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/update_user/${domainId}/${username}?user_id=${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
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
      console.error("Error updating user:", error);
      throw error;
    }
  },

  /**
   * Delete a user from a domain
   * @param {string} username - The username to delete
   * @param {number} domainId - The domain ID
   * @param {string} userId - The user ID performing this action
   * @returns {Promise} - API response
   */
  deleteUser: async (username, domainId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete_user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          domain_id: domainId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  /**
   * Get all departments for a specific domain
   * @param {string|number} domainId - The domain ID
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response with departments data
   */
  listDepartmentsByDomain: async (domainId, userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/list_departments_by_domain/${domainId}?user_id=${userId}`,
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
      console.error(
        `Error fetching departments for domain ${domainId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Add a new department to a domain
   * @param {Object} departmentData - The department data to create
   * @returns {Promise} - API response
   */
  addDepartment: async (departmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/add_department`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding department:", error);
      throw error;
    }
  },

  /**
   * Update an existing department
   * @param {string|number} domainId - The domain ID
   * @param {string|number} departmentId - The department ID
   * @param {Object} departmentData - The updated department data
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response
   */
  updateDepartment: async (domainId, departmentId, departmentData, userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/update_department/${domainId}/${departmentId}?user_id=${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(departmentData),
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
      console.error(`Error updating department ${departmentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a department
   * @param {string|number} domainId - The domain ID
   * @param {string|number} departmentId - The department ID
   * @param {string} userId - The user's UUID from Supabase
   * @returns {Promise} - API response
   */
  deleteDepartment: async (domainId, departmentId, userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/delete_department/${domainId}/${departmentId}?user_id=${userId}`,
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
      console.error(`Error deleting department ${departmentId}:`, error);
      throw error;
    }
  },
};

export default DomainService;
