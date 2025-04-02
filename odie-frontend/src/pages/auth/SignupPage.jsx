import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";
import odieIcon from "../../assets/img/icon.png";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error } = await AuthService.signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Removed auto-redirect to let user click the button instead
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="flex flex-col items-center">
          <img src={odieIcon} alt="Odie Logo" className="w-16 h-16 mb-2" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <h3 className="text-lg font-medium mb-2">
                Hesabınız oluşturuldu!
              </h3>
              <p>
                Hesabınıza onay mail'i gönderildi. Lütfen gelen kutunuzu kontrol
                edin.
              </p>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#556ac6] hover:bg-[#4a5db3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-odie"
            >
              Giriş Ekranına Dön
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-odie focus:border-odie focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-odie focus:border-odie focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-odie focus:border-odie focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#556ac6] hover:bg-[#4a5db3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-odie"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </div>

            <div className="text-sm text-center">
              <p>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-[#556ac6] hover:text-[#4a5db3]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignupPage;
