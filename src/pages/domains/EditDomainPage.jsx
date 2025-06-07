import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function EditDomainPage() {
  const navigate = useNavigate();
  const { domainId } = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    domain_name: "",
    domain_ip: "",
    domain_port: 389,
    use_custom_port: false,
    domain_component: "",
    ldap_user: "",
    ldap_password: "",
    domain_type: "ms",
    status: "devrede",
  });

  const [originalDomain, setOriginalDomain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load domain data on component mount
  useEffect(() => {
    const loadDomainData = async () => {
      if (!user || !domainId) {
        setError("Missing user or domain information");
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);

        // Get all domains and find the specific one by ID
        const response = await DomainService.listDomains(user.id);
        const domains = response.domains || [];
        const domain = domains.find(
          (d) => d.id.toString() === domainId.toString()
        );

        if (!domain) {
          setError("Domain not found");
          setLoadingData(false);
          return;
        }

        setOriginalDomain(domain);

        // Convert domain component back to readable format (DC=odieproje,DC=local -> odieproje.local)
        const domainComponent = domain.domain_component
          ? domain.domain_component.replace(/DC=/g, "").replace(/,/g, ".")
          : "";

        // Extract username from formatted LDAP user
        let ldapUser = domain.ldap_user || "";
        if (domain.domain_type === "samba" && ldapUser.includes("@")) {
          ldapUser = ldapUser.split("@")[0];
        } else if (domain.domain_type === "ms" && ldapUser.startsWith("CN=")) {
          const match = ldapUser.match(/CN=([^,]+)/);
          ldapUser = match ? match[1] : ldapUser;
        }

        setFormData({
          domain_name: domain.domain_name || "",
          domain_ip: domain.domain_ip || "",
          domain_port: domain.domain_port || 389,
          use_custom_port: domain.domain_port !== 389,
          domain_component: domainComponent,
          ldap_user: ldapUser,
          ldap_password: domain.ldap_password || "",
          domain_type: domain.domain_type || "ms",
          status: domain.status || "devrede",
        });

        setError(null);
      } catch (err) {
        console.error("Error loading domain data:", err);
        setError(`Failed to load domain data: ${err.message}`);
      } finally {
        setLoadingData(false);
      }
    };

    loadDomainData();
  }, [user, domainId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "use_custom_port") {
      setFormData((prev) => ({
        ...prev,
        use_custom_port: checked,
        domain_port: checked ? prev.domain_port : 389,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Format domain component to DC= format
  const formatDomainComponent = (domainComponent) => {
    if (!domainComponent) return "";

    const parts = domainComponent.split(".");
    return parts.map((part) => `DC=${part}`).join(",");
  };

  // Format LDAP user based on domain type
  const formatLdapUser = (username, domainComponent, domainType) => {
    if (!username || !domainComponent) return username;

    if (domainType === "samba") {
      // Format: Administrator@ODIEPROJE.SERVER
      return `${username}@${domainComponent.toUpperCase()}`;
    } else {
      // Format: CN=Administrator,CN=Users,DC=odieproje,DC=local
      const dcPart = formatDomainComponent(domainComponent);
      return `CN=${username},CN=Users,${dcPart}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !domainId) {
      setError("Missing user or domain information");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        domain_name: formData.domain_name,
        domain_ip: formData.domain_ip,
        domain_component: formatDomainComponent(formData.domain_component),
        ldap_user: formatLdapUser(
          formData.ldap_user,
          formData.domain_component,
          formData.domain_type
        ),
        ldap_password: formData.ldap_password,
        domain_type: formData.domain_type,
        status: formData.status === "devrede" ? "devrede" : "devre dışı",
      };

      await DomainService.updateDomain(domainId, submitData, user.id);

      // Navigate back to domains page on success
      navigate("/domains");
    } catch (err) {
      console.error("Error updating domain:", err);
      setError(`Failed to update domain: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !domainId) {
      setError("Missing user or domain information");
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      await DomainService.deleteDomain(domainId, user.id);

      // Navigate back to domains page on success
      navigate("/domains");
    } catch (err) {
      console.error("Error deleting domain:", err);
      setError(`Failed to delete domain: ${err.message}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loadingData) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
          <button
            onClick={() => navigate("/domains")}
            className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          Edit Domain
        </div>
        <div className="p-6 flex justify-center">
          <p className="text-gray-600">Loading domain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
        <button
          onClick={() => navigate("/domains")}
          className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        Edit Domain - {originalDomain?.domain_name || "Loading..."}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-odie">
              Domain Information
            </h2>
            <p className="text-sm text-gray-600">
              Update the domain details below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Domain Name */}
              <div>
                <label
                  htmlFor="domain_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Domain Name
                </label>
                <input
                  type="text"
                  id="domain_name"
                  name="domain_name"
                  required
                  value={formData.domain_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                  placeholder="Enter domain name"
                />
              </div>

              {/* Domain IP */}
              <div>
                <label
                  htmlFor="domain_ip"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Domain IP
                </label>
                <input
                  type="text"
                  id="domain_ip"
                  name="domain_ip"
                  required
                  value={formData.domain_ip}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                  placeholder="192.168.1.100"
                />
              </div>

              {/* Domain Component */}
              <div className="md:col-span-2">
                <label
                  htmlFor="domain_component"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Domain Component
                </label>
                <input
                  type="text"
                  id="domain_component"
                  name="domain_component"
                  required
                  value={formData.domain_component}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                  placeholder="odieproje.local or odieproje.server"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be automatically formatted as DC=odieproje,DC=local
                </p>
              </div>

              {/* LDAP User */}
              <div>
                <label
                  htmlFor="ldap_user"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  LDAP User
                </label>
                <input
                  type="text"
                  id="ldap_user"
                  name="ldap_user"
                  required
                  value={formData.ldap_user}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                  placeholder="Administrator"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.domain_type === "samba"
                    ? "Will be formatted as Administrator@DOMAIN.SERVER"
                    : "Will be formatted as CN=Administrator,CN=Users,DC=domain,DC=local"}
                </p>
              </div>

              {/* LDAP Password */}
              <div>
                <label
                  htmlFor="ldap_password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  LDAP Password
                </label>
                <input
                  type="password"
                  id="ldap_password"
                  name="ldap_password"
                  required
                  value={formData.ldap_password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                  placeholder="Enter LDAP password"
                />
              </div>

              {/* Domain Type */}
              <div>
                <label
                  htmlFor="domain_type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Domain Type
                </label>
                <select
                  id="domain_type"
                  name="domain_type"
                  value={formData.domain_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                >
                  <option value="ms">Microsoft ADDC</option>
                  <option value="samba">Samba</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                >
                  <option value="devrede">Online</option>
                  <option value="devre dışı">Offline</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/domains")}
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
                <span>{loading ? "Updating..." : "Update Domain"}</span>
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
                <h3 className="text-sm font-medium text-gray-900">
                  Delete Domain
                </h3>
                <p className="text-sm text-gray-500">
                  Once you delete this domain, there is no going back. This will
                  permanently delete the domain and all associated data.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="md:w-auto w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Domain
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Domain
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete &ldquo;
                  {originalDomain?.domain_name}&rdquo;? This action cannot be
                  undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleteLoading && (
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                  )}
                  <span>{deleteLoading ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditDomainPage;
