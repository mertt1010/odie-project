import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function EditUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const domainId = searchParams.get("domain_id");
  const domainName = searchParams.get("domain_name");
  const username = searchParams.get("username");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    password: "",
    role_id: 2, // Default to "user"
    department_id: 0,
  });

  const [originalUser, setOriginalUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Role options
  const roleOptions = [
    { value: 1, label: "Admin" },
    { value: 2, label: "User" },
    { value: 3, label: "Guest" },
  ];

  // Load departments and user data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        // Load departments
        const departmentsResponse = await DomainService.listDepartments();
        setDepartments(departmentsResponse.departments || []);

        // Load user data from the domain
        if (domainId && username) {
          const usersResponse = await DomainService.listUsersByDomain(
            parseInt(domainId)
          );
          const users = usersResponse.users || [];
          const currentUser = users.find((u) => u.username === username);

          if (currentUser) {
            setOriginalUser(currentUser);
            setFormData({
              first_name: currentUser.first_name || "",
              last_name: currentUser.last_name || "",
              password: currentUser.password || "",
              role_id: currentUser.role_id || 2,
              department_id: currentUser.department_id || 0,
            });
          } else {
            setError("User not found");
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [domainId, username]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to edit a user");
      return;
    }

    if (!domainId || !username) {
      setError("Domain ID and username are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        role_id: formData.role_id,
        department_id: formData.department_id,
      };

      await DomainService.updateUser(parseInt(domainId), username, submitData);

      // Navigate back to users page on success
      navigate("/users");
    } catch (err) {
      console.error("Error updating user:", err);
      setError(`Failed to update user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !domainId || !username) {
      setError("Missing required information for deletion");
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      await DomainService.deleteUser(username, parseInt(domainId));

      // Navigate back to users page on success
      navigate("/users");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(`Failed to delete user: ${err.message}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleEnableUser = async () => {
    if (!user || !domainId || !username) {
      setError("Missing required information for enabling user");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await DomainService.enableUser(username, parseInt(domainId));

      // Update the original user status locally
      setOriginalUser((prev) => ({ ...prev, status: "devrede" }));
      setError(null);
    } catch (err) {
      console.error("Error enabling user:", err);
      setError(`Failed to enable user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableUser = async () => {
    if (!user || !domainId || !username) {
      setError("Missing required information for disabling user");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await DomainService.disableUser(username, parseInt(domainId));

      // Update the original user status locally
      setOriginalUser((prev) => ({ ...prev, status: "devre dışı" }));
      setError(null);
    } catch (err) {
      console.error("Error disabling user:", err);
      setError(`Failed to disable user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          <button
            onClick={() => navigate("/users")}
            className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          Edit User
        </div>
        <div className="p-6 flex justify-center">
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error && !originalUser) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          <button
            onClick={() => navigate("/users")}
            className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          Edit User
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
        <button
          onClick={() => navigate("/users")}
          className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        Edit User: {username}
        {domainName && (
          <span className="ml-2 text-gray-600 text-lg font-normal">
            in {domainName}
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* User Information Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-odie">
              User Information
            </h2>
            <p className="text-sm text-gray-600">Update the user's details</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Username (Read-only) */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Username cannot be changed
              </p>
            </div>

            {/* First Name */}
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                placeholder="Enter new password"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Role *
              </label>
              <select
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Department
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
              >
                <option value={0}>Not Assigned</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/users")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-odie text-white rounded-md hover:bg-odie/90 focus:outline-none focus:ring-2 focus:ring-odie focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <i className="bi bi-arrow-repeat animate-spin"></i>}
                <span>{loading ? "Updating..." : "Update User"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* User Status Section */}
        {originalUser && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-odie">User Status</h2>
              <p className="text-sm text-gray-600">
                Manage user account status
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Current Status
                    </h3>
                    <div className="mt-2">
                      <span
                        className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                          originalUser.status === "devrede"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {originalUser.status === "devrede"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {originalUser.status === "devrede" ? (
                    <button
                      onClick={handleDisableUser}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && (
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                      )}
                      <i className="bi bi-person-dash"></i>
                      <span>Disable User</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleEnableUser}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && (
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                      )}
                      <i className="bi bi-person-check"></i>
                      <span>Enable User</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-red-200">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="text-sm text-red-500">
              Irreversible and destructive actions
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete User
                </h3>
                <p className="text-sm text-gray-500">
                  Once you delete this user, there is no going back. Please be
                  certain.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Delete User
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete user "{username}"? This action
                  cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md w-24 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditUserPage;
