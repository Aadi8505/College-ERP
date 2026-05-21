import React, { useState, useEffect } from "react";
import { FiLogIn, FiMail, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    toast.loading("Authenticating...");
    try {
      const response = await axiosWrapper.post(
        "/auth/login",
        {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.dismiss();
      if (response.data.success) {
        const { role } = response.data.data;
        
        // Save credentials using browser's native Credential Management API
        // This will prompt the user to save password and enable autofill next time
        const saveCredentials = async () => {
          if (typeof window.PasswordCredential !== "undefined" && navigator.credentials) {
            try {
              const credential = new window.PasswordCredential({
                id: formData.email.toLowerCase().trim(),
                password: formData.password,
              });
              
              // Store credentials - browser will show save dialog
              await navigator.credentials.store(credential);
              console.log("✓ Credentials saved successfully");
            } catch (error) {
              console.error("Could not save credentials:", error.message);
              // Gracefully fail - login still succeeds
            }
          }
        };

        // Save credentials in parallel with showing toast
        saveCredentials();
        
        // Capitalize role to match frontend expectations (Student, Faculty, Admin)
        // const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);

        toast.success("Welcome back!");
        
        // Short delay to let the toast show before redirecting
        setTimeout(() => {
          navigate(`/${role.toLowerCase()}`);
        }, 800);
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const resp = await axiosWrapper.get("/auth/my-details");
        if (resp.data?.success) {
          navigate(`/${resp.data.data.role}`);
        }
      } catch {
        // Not logged in
      }
    };

    // Try to get saved credentials from browser's password manager
    // This provides seamless autofill experience like modern websites
    const loadSavedCredentials = async () => {
      if (navigator.credentials && navigator.credentials.get) {
        try {
          const credential = await navigator.credentials.get({
            password: true,
            mediation: "silent", // Silently retrieve if available, no UI
          });
          
          if (credential && credential.id && credential.password) {
            console.log("✓ Credentials auto-filled from browser");
            setFormData({
              email: credential.id,
              password: credential.password,
            });
          }
        } catch (error) {
          console.log("Could not retrieve saved credentials:", error.message);
          // Gracefully continue without saved credentials
        }
      }
    };

    loadSavedCredentials();
    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div>
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <FiLogIn className="text-2xl" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 tracking-tight">
            College Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Sign in to access your dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="on">
          <div className="rounded-md space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiMail />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="pl-10 w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="name@university.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-12 w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Your password will be securely saved to your browser's password manager
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => navigate("/forget-password")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <div>
            <CustomButton
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex justify-center items-center gap-2"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <FiLogIn className="text-lg" />}
            </CustomButton>
          </div>
        </form>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;
