import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DomainService from "../../services/DomainService";
import { useAuth } from "../../context/AuthContext";

function DomainsPage() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchDomains = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await DomainService.listDomains(user.id);
        const domainsData = response.domains || [];

        setDomains(domainsData);
        console.log(domainsData);
        setFilteredDomains(domainsData);

        // Initialize password visibility state
        const initialVisibility = {};
        domainsData.forEach((domain) => {
          initialVisibility[domain.id] = false;
        });
        setPasswordVisibility(initialVisibility);

        setError(null);
      } catch (err) {
        console.error("Error fetching domains:", err);
        setError("Failed to load domains. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, [user]);

  // Filter domains based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDomains(domains);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = domains.filter(
      (domain) =>
        (domain.domain_name &&
          domain.domain_name.toLowerCase().includes(term)) ||
        (domain.domain_ip && domain.domain_ip.toLowerCase().includes(term)) ||
        (domain.ldap_user && domain.ldap_user.toLowerCase().includes(term)) ||
        (domain.domain_type && domain.domain_type.toLowerCase().includes(term))
    );

    setFilteredDomains(results);
  }, [searchTerm, domains]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const togglePasswordVisibility = (id) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEdit = (domain) => {
    navigate(`/domains/edit/${domain.id}`);
  };

  const handleAddDomain = () => {
    navigate("/domains/add");
  };

  // Show error message if present
  if (error) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="hidden md:flex h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie items-center">
          <p className="hidden md:block">Domains</p>
        </div>
        <div className="m-6 bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-auto md:h-[72px] border-b border-gray-300 w-full p-6 md:pl-6 font-bold text-[24px] text-odie flex items-center justify-center md:justify-between">
        <p className="hidden md:block">Domains</p>
        <div className="flex items-center gap-4 md:flex-row flex-col w-full md:w-auto">
          <button
            onClick={handleAddDomain}
            className="bg-odie md:bg-transparent md:text-odie text-[16px] font-medium text-white rounded-md hover:text-gray-600 w-full md:p-0 p-2 md:w-auto w-fullcursor-pointer"
          >
            <i className="bi bi-plus-lg"></i> Add Domain
          </button>
          <div className="flex items-center justify-between w-full md:w-[300px] px-3 py-2 bg-white rounded-md border border-gray-300">
            <input
              type="text"
              placeholder="Search by domain name"
              className="bg-transparent text-[16px] font-normal w-[90%] text-gray-800 outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="bi bi-search text-[16px]"></i>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="m-6 flex justify-center">
          <p className="text-gray-600">Loading domains...</p>
        </div>
      ) : !user ? (
        <div className="m-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-700">
          <p>Please log in to view your domains.</p>
        </div>
      ) : filteredDomains.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden m-6">
          {/* Desktop table view - Hidden on mobile */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Domain Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Domain IP
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    LDAP User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    LDAP Password
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Domain Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDomains.map((domain) => (
                  <tr key={domain.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-odie">
                      {domain.domain_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {domain.domain_ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {domain.ldap_user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {passwordVisibility[domain.id]
                            ? domain.ldap_password
                            : "••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(domain.id)}
                          className="text-odie"
                        >
                          <i
                            className={`bi ${
                              passwordVisibility[domain.id]
                                ? "bi-eye-slash"
                                : "bi-eye"
                            }`}
                          ></i>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {domain.domain_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          domain.status === "devrede"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {domain.status === "devrede"
                          ? "Online"
                          : "Connection Error"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(domain)}
                        className="text-odie hover:text-gray-600 flex items-center gap-2 cursor-pointer"
                      >
                        <i className="bi bi-pencil-square text-lg"></i> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view - Only shown on mobile */}
          <div className="md:hidden">
            {filteredDomains.map((domain) => (
              <div key={domain.id} className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-odie text-lg">
                    {domain.domain_name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      domain.status === "devrede"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {domain.status === "devrede"
                      ? "Online"
                      : "Connection Error"}
                  </span>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1 font-medium">Domain IP:</p>
                    <p className="font-medium break-words">
                      {domain.domain_ip}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1 font-medium">LDAP User:</p>
                    <p className="font-medium break-words">
                      {domain.ldap_user}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1 font-medium">
                      LDAP Password:
                    </p>
                    <div className="flex items-center">
                      <p className="font-medium break-words mr-2">
                        {passwordVisibility[domain.id]
                          ? domain.ldap_password
                          : "••••••••"}
                      </p>
                      <button
                        onClick={() => togglePasswordVisibility(domain.id)}
                        className="text-odie flex-shrink-0"
                      >
                        <i
                          className={`bi ${
                            passwordVisibility[domain.id]
                              ? "bi-eye-slash"
                              : "bi-eye"
                          }`}
                        ></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1 font-medium">
                      Domain Type:
                    </p>
                    <p className="font-medium">{domain.domain_type}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(domain)}
                    className="w-full text-odie hover:text-gray-600 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="bi bi-pencil-square text-lg"></i> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-gray-500">
          No domains found matching your search.
        </p>
      )}
    </div>
  );
}

export default DomainsPage;
