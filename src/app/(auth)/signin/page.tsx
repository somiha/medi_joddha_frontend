"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    mobile_number: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Check existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      router.replace("/"); // Use replace() to prevent back navigation to login
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ FIXED: Removed trailing spaces
      const url = "https://medijoddha.save71.net/api/admin/auth/login";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: formData.mobile_number,
          password: formData.password,
        }),
      });

      const data = await response.json();

      console.log("Sign in response", response);

      console.log("Sign in response data:", data);

      if (response.ok && data.token && data.admin) {
        console.log("Sign in successful:", data);
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.admin));
        localStorage.setItem("adminType", data.admin.type || "admin");

        // ✅ Redirect immediately
        router.replace("/");
        return; // prevent further execution
      }

      // Handle error
      setErrorMessage(
        data.message || "Sign in failed. Please check your credentials."
      );
      setErrorModalOpen(true);
    } catch (error) {
      console.error("Sign in error:", error);
      setErrorMessage("An error occurred. Please try again.");
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-sm">
          Checking authentication...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] p-4">
      {/* 🔴 Error Modal */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Sign In Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{errorMessage}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setErrorModalOpen(false)}
              className="bg-primary"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🟢 Sign In Card */}
      <Card className="w-full max-w-md bg-[#f9fafb] shadow-xl rounded-2xl">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold mb-1 text-primary text-center">
            Welcome to License Course Admin Panel!
          </h1>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Sign in to continue
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Phone Number */}
            <div>
              <Label htmlFor="mobile_number" className="text-sm text-gray-700">
                Phone Number
              </Label>
              <Input
                id="mobile_number"
                type="text"
                placeholder="+8801XXXXXXXXX"
                value={formData.mobile_number}
                onChange={handleInputChange}
                className="mt-1 bg-white text-gray-900 border border-gray-300 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Label htmlFor="password" className="text-sm text-gray-700">
                PIN Number
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-white text-gray-900 border border-gray-300 placeholder:text-gray-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white hover:opacity-90"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don’t have an account?{" "}
              <a href="/signup" className="text-[#6366F1] hover:underline">
                Sign Up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
