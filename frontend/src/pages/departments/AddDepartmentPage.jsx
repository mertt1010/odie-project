import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function AddDepartmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    department_name: "",
    domain_id: "",
  });

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if domain was passed from previous page
    if (location.state?.domain) {
      setSelectedDomain(location.state.domain);
      setFormData((prev) => ({
        ...prev,
        domain_id: location.state.domain.id,
      }));
    } else {
      // Fetch domains for selection
      fetchDomains();
    }
  }, [location.state]);

  const fetchDomains = async () => {
    if (!user) return;

    try {
      const response = await DomainService.listDomains(user.id);
      setDomains(response.domains || []);
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError("Failed to load domains. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDomainChange = (e) => {
    const domainId = e.target.value;
    const domain = domains.find((d) => d.id.toString() === domainId);

    setFormData((prev) => ({
      ...prev,
      domain_id: parseInt(domainId),
    }));
    setSelectedDomain(domain);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("User not authenticated");
      return;
    }

    if (!formData.department_name.trim()) {
      setError("Department name is required");
      return;
    }

    if (!formData.domain_id) {
      setError("Please select a domain");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const departmentData = {
        department_name: formData.department_name.trim(),
        domain_id: formData.domain_id,
        created_by: user.id,
      };

      await DomainService.addDepartment(departmentData);
      setSuccess(true);

      // Navigate back to departments page after a short delay
      setTimeout(() => {
        navigate("/departments");
      }, 1500);
    } catch (err) {
      console.error("Error adding department:", err);
      setError(err.message || "Failed to add department. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/departments");
  };

  if (success) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          <button
            onClick={() => navigate("/departments")}
            className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          Add Department
        </div>
        <div className="p-6 flex justify-center">
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-green-700">
            <div className="flex items-center">
              <i className="bi bi-check-circle mr-2"></i>
              <span>
                Department has been added successfully. Redirecting...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
        <button
          onClick={() => navigate("/departments")}
          className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        Add Department
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
              Department Information
            </h2>
            <p className="text-sm text-gray-600">
              {selectedDomain
                ? `Creating a new department for domain "${selectedDomain.domain_name}"`
                : "Fill in the details to create a new department"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {!selectedDomain && (
              <div>
                <label
                  htmlFor="domain_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Domain *
                </label>
                <select
                  id="domain_id"
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleDomainChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDomain && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {selectedDomain.domain_name}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="department_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Department Name *
              </label>
              <input
                type="text"
                id="department_name"
                name="department_name"
                value={formData.department_name}
                onChange={handleInputChange}
                placeholder="Enter department name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                required
              />
            </div>

            <div className="flex md:justify-end justify-center space-x-4 pt-8 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
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
                <span>{loading ? "Adding..." : "Add Department"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddDepartmentPage;
