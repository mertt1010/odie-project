import { useState, useEffect } from "react";
import mockDomains from "../../test/domains.json";

function DomainsPage() {
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [passwordVisibility, setPasswordVisibility] = useState({});

  useEffect(() => {
    // Load domains from mock data
    setDomains(mockDomains);
    setFilteredDomains(mockDomains);

    // Initialize password visibility state
    const initialVisibility = {};
    mockDomains.forEach((domain) => {
      initialVisibility[domain.id] = false;
    });
    setPasswordVisibility(initialVisibility);

    setLoading(false);
  }, []);

  // Filter domains based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDomains(domains);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = domains.filter(
      (domain) =>
        domain.name.toLowerCase().includes(term) ||
        domain.ip.toLowerCase().includes(term) ||
        domain.ldap_user.toLowerCase().includes(term) ||
        domain.domain_type.toLowerCase().includes(term)
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
    console.log("Edit domain:", domain);
    // Implement edit functionality here
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="h-[72px] border-b border-gray-300 w-full pl-6 font-bold text-[24px] text-odie flex items-center justify-between">
        Domains
        <div className="flex items-center">
          <button className="bg-transparent text-[16px] font-medium text-odie rounded-md mr-6 hover:text-gray-600 cursor-pointer">
            <i className="bi bi-plus-lg"></i> Add Domain
          </button>
          <div className="flex items-center justify-between w-[300px] mr-6 px-3 py-2 bg-white rounded-md border border-gray-300">
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
        <p>Loading...</p>
      ) : filteredDomains.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden m-6">
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
                    {domain.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {domain.ip}
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
                        domain.status === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {domain.status === "online"
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
      ) : (
        <div className="m-6 bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No domains found matching your search.
        </div>
      )}
    </div>
  );
}

export default DomainsPage;
