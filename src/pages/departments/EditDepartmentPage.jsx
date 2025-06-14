import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function EditDepartmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { domainId, departmentId } = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    department_name: "",
  });

  const [department, setDepartment] = useState(null);
  const [domain, setDomain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Check if department and domain were passed from previous page
    if (location.state?.department && location.state?.domain) {
      setDepartment(location.state.department);
      setDomain(location.state.domain);
      setFormData({
        department_name: location.state.department.name,
      });
    } else {
      // If not passed, we need to fetch the data (this is a fallback)
      fetchDepartmentData();
    }
  }, [location.state, domainId, departmentId]);

  const fetchDepartmentData = async () => {
    if (!user || !domainId || !departmentId) return;

    try {
      // For now, we'll just set an error since we don't have a single department endpoint
      setError(
        "Department data not found. Please return to the departments page and try again."
      );
    } catch (err) {
      console.error("Error fetching department:", err);
      setError("Failed to load department data. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (!department || !domain) {
      setError("Department or domain information is missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const departmentData = {
        department_name: formData.department_name.trim(),
      };

      await DomainService.updateDepartment(
        domain.id,
        department.id,
        departmentData,
        user.id
      );

      setSuccess(true);

      // Navigate back to departments page after a short delay
      setTimeout(() => {
        navigate("/departments");
      }, 1500);
    } catch (err) {
      console.error("Error updating department:", err);
      setError(err.message || "Failed to update department. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user || !department || !domain) {
      setError("Missing required information for deletion");
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      await DomainService.deleteDepartment(domain.id, department.id, user.id);

      // Navigate back to departments page immediately after successful deletion
      navigate("/departments");
    } catch (err) {
      console.error("Error deleting department:", err);
      setError(err.message || "Failed to delete department. Please try again.");
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    navigate("/departments");
  };

  if (success) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="md:flex-row flex-col h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          <button
            onClick={() => navigate("/departments")}
            className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          Edit Department
        </div>
        <div className="p-6">
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-green-700">
            Department has been updated successfully. Redirecting...
          </div>
        </div>
      </div>
    );
  }

  if (!department || !domain) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="md:flex-row flex-col h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          <button
            onClick={() => navigate("/departments")}
            className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          Edit Department
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error ||
              "Department information not found. Please return to the departments page and try again."}
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
        Edit Department
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Department Information Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-odie">
              Department Information
            </h2>
            <p className="text-sm text-gray-600">
              Editing department &ldquo;{department.name}&rdquo; in domain
              &ldquo;{domain.domain_name}&rdquo;
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Domain (Read-only) */}
            <div>
              <label
                htmlFor="domain"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Domain
              </label>
              <input
                type="text"
                id="domain"
                value={domain.domain_name || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Domain cannot be changed
              </p>
            </div>

            {/* Department Name */}
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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                placeholder="Enter department name"
              />
            </div>

            {/* Submit Button */}
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
                <span>{loading ? "Updating..." : "Update Department"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-red-200">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="text-sm text-red-500">
              Irreversible and destructive actions
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-start md:items-center justify-between md:flex-row flex-col gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Department
                </h3>
                <p className="text-sm text-gray-500">
                  Once you delete this department, there is no going back.
                  Please be certain.
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="md:w-auto w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">
                  Delete Department
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete department "
                    {department.name}"? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={confirmDelete}
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
                    onClick={cancelDelete}
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
    </div>
  );
}

export default EditDepartmentPage;
