import { useState } from "react";
import { Link } from "react-router-dom";
import logoColored from "../assets/img/logo_colored.png";
import odieIcon from "../assets/img/icon.png";

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: "bi-people-fill",
      title: "User Management",
      description:
        "Efficiently manage users, roles, and permissions across your Active Directory infrastructure.",
    },
    {
      icon: "bi-building",
      title: "Department Organization",
      description:
        "Organize and structure your departments with hierarchical management capabilities.",
    },
    {
      icon: "bi-globe",
      title: "Domain Administration",
      description:
        "Comprehensive domain management with real-time monitoring and configuration tools.",
    },
    {
      icon: "bi-shield-check",
      title: "Security & Compliance",
      description:
        "Advanced security features with audit trails and compliance reporting.",
    },
    {
      icon: "bi-graph-up",
      title: "Analytics & Reporting",
      description:
        "Detailed insights and analytics for better decision-making and optimization.",
    },
    {
      icon: "bi-gear-fill",
      title: "Easy Configuration",
      description:
        "Intuitive interface for quick setup and configuration of your AD environment.",
    },
  ];

  return (
    <div className="min-h-dvh bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logoColored} alt="Odie" className="h-8" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-odie transition-colors"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-600 hover:text-odie transition-colors"
              >
                About
              </a>
              <Link
                to="/login"
                className="bg-odie text-white px-4 py-2 rounded-lg hover:bg-odie/90 transition-colors"
              >
                Sign In
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-odie focus:outline-none"
              >
                <i
                  className={`bi ${isMenuOpen ? "bi-x-lg" : "bi-list"} text-xl`}
                ></i>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <a
                  href="#features"
                  className="text-gray-600 hover:text-odie transition-colors"
                >
                  Features
                </a>
                <a
                  href="#about"
                  className="text-gray-600 hover:text-odie transition-colors"
                >
                  About
                </a>
                <Link
                  to="/login"
                  className="bg-odie text-white px-4 py-2 rounded-lg hover:bg-odie/90 transition-colors text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-odie/45 to-white h-[calc(100dvh-64px)] flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl lg:text-6xl font-bold text-gray-900 mb-6">
              Simplify Your <span className="text-odie">Active Directory</span>{" "}
              Management
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline user management, domain administration, and
              organizational structure with our powerful and intuitive Active
              Directory dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-odie text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-odie/90 transition-colors"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="border-2 border-odie text-odie px-8 py-2 rounded-lg text-lg font-semibold hover:bg-odie hover:text-white transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern IT Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your Active Directory infrastructure
              efficiently and securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-odie/10 rounded-lg flex items-center justify-center mb-6">
                  <i className={`${feature.icon} text-odie text-xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Built for Modern Organizations
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Odie AD Dashboard provides a comprehensive solution for managing
                your Active Directory environment with ease. Our intuitive
                interface and powerful features make complex administrative
                tasks simple and efficient.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <i className="bi bi-check-circle-fill text-odie text-xl mr-3"></i>
                  <span className="text-gray-700">
                    Intuitive user interface
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="bi bi-check-circle-fill text-odie text-xl mr-3"></i>
                  <span className="text-gray-700">
                    Real-time monitoring and alerts
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="bi bi-check-circle-fill text-odie text-xl mr-3"></i>
                  <span className="text-gray-700">
                    Comprehensive audit trails
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="bi bi-check-circle-fill text-odie text-xl mr-3"></i>
                  <span className="text-gray-700">
                    Advanced security features
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-odie/10 to-odie/5 rounded-2xl p-8 lg:p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-odie rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <i className="bi bi-lightning-fill text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of IT professionals who trust Odie for their
                  Active Directory management.
                </p>
                <Link
                  to="/login"
                  className="bg-odie text-white px-6 py-3 rounded-lg font-semibold hover:bg-odie/90 transition-colors inline-block"
                >
                  Start Your Journey
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={odieIcon} alt="Odie" className="w-8 h-8" />
              <span className="ml-2 text-xl font-bold">Odie AD Dashboard</span>
            </div>
            <div className="flex space-x-6">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Odie AD Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
