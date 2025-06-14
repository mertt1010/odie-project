import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function AddUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const domainId = searchParams.get("domain_id");
  const domainName = searchParams.get("domain_name");

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    role_id: 2, // Default to "user"
    department_id: 0,
    domain_id: domainId ? parseInt(domainId) : 0,
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Role options
  const roleOptions = [
    { value: 1, label: "Admin" },
    { value: 2, label: "User" },
    { value: 3, label: "Guest" },
  ];

  // Load departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingData(true);
        const response = await DomainService.listDepartments();
        setDepartments(response.departments || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError("Failed to load departments. Please try again later.");
      } finally {
        setLoadingData(false);
      }
    };

    loadDepartments();
  }, []);

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
      setError("You must be logged in to add a user");
      return;
    }

    if (!formData.domain_id) {
      setError("Domain ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        role_id: formData.role_id,
        department_id: formData.department_id,
        domain_id: formData.domain_id,
      };

      await DomainService.addUser(submitData);

      // Navigate back to users page on success
      navigate("/users");
    } catch (err) {
      console.error("Error adding user:", err);
      setError(`Failed to add user: ${err.message}`);
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
          Add New User
        </div>
        <div className="p-6 flex justify-center">
          <p className="text-gray-600">Loading data...</p>
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
        Add User
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-odie">
              User Information
            </h2>
            <p className="text-sm text-gray-600">
              {domainName
                ? `Creating a new user for domain "${domainName}"`
                : "Fill in the details to create a new user"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                placeholder="Enter username"
              />
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
                placeholder="Enter password"
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

            {/* Domain ID (Hidden field, populated from URL params) */}
            <input type="hidden" name="domain_id" value={formData.domain_id} />

            {/* Submit Button */}
            <div className="flex md:justify-end justify-center space-x-4 pt-8 mt-6 border-t border-gray-200">
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
                <span>{loading ? "Adding..." : "Add User"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddUserPage;
