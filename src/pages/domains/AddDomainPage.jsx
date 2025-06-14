import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DomainService from "../../services/DomainService";

function AddDomainPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    domain_name: "",
    domain_ip: "",
    domain_port: 389,
    use_custom_port: false,
    domain_component: "",
    ldap_user: "",
    ldap_password: "",
    domain_type: "ms", // Default to Microsoft ADDC
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    if (!user) {
      setError("You must be logged in to add a domain");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        domain_name: formData.domain_name,
        domain_ip: formData.domain_ip,
        domain_port: formData.use_custom_port
          ? parseInt(formData.domain_port)
          : 389,
        domain_component: formatDomainComponent(formData.domain_component),
        ldap_user: formatLdapUser(
          formData.ldap_user,
          formData.domain_component,
          formData.domain_type
        ),
        ldap_password: formData.ldap_password,
        domain_type: formData.domain_type,
        created_by: user.id,
      };

      await DomainService.addDomain(submitData);

      // Navigate back to domains page on success
      navigate("/domains");
    } catch (err) {
      console.error("Error adding domain:", err);
      setError(`Failed to add domain: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center">
        <button
          onClick={() => navigate("/domains")}
          className="mr-4 text-gray-600 hover:text-odie cursor-pointer"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        Add Domain
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
              Domain Information
            </h2>
            <p className="text-sm text-gray-600">
              Fill in the details to add a new domain to your system
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

              {/* Domain Port */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain PORT
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="domain_port"
                    name="domain_port"
                    value={formData.domain_port}
                    onChange={handleInputChange}
                    disabled={!formData.use_custom_port}
                    className={`w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent ${
                      !formData.use_custom_port
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    placeholder="389"
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="use_custom_port"
                      checked={formData.use_custom_port}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-odie border-gray-300 rounded focus:ring-odie"
                    />
                    <span className="text-sm text-gray-700">Custom Port</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Default port is 389. Check the box to use a custom port.
                </p>
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
              <div className="md:col-span-2">
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
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-odie focus:border-transparent"
                >
                  <option value="ms">Microsoft ADDC</option>
                  <option value="samba">Samba</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex md:justify-end justify-center space-x-4 pt-8 mt-6 border-t border-gray-200">
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
                <span>{loading ? "Adding..." : "Add Domain"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddDomainPage;
