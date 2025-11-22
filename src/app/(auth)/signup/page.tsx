"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    password: "",
  });

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isFormValid, setIsFormValid] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  useEffect(() => {
    const isValid =
      formData.full_name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.mobile_number.trim() !== "" &&
      formData.password.trim() !== "";

    setIsFormValid(isValid);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile_number", formData.mobile_number);
      formDataToSend.append("password", formData.password);

      const response = await fetch(
        "https://medijoddha.save71.net/api/admin/auth/register",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const responseData = await response.json();

      if (response.status === 201) {
        // Success - redirect to signin
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else if (response.status === 400) {
        setErrorMessage(
          responseData.message || "Email or phone number already in use"
        );
        setErrorModalOpen(true);
      } else {
        setErrorMessage(responseData.message || "Registration failed");
        setErrorModalOpen(true);
      }
    } catch (error) {
      setErrorMessage("An error occurred during registration");
      setErrorModalOpen(true);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9fafb] to-[#f3f4f6] p-4">
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{errorMessage}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setErrorModalOpen(false)}
              className="bg-[#71113D] hover:bg-[#5a0f2f]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-primary h-2 w-full"></div>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-1 text-primary">
              Create Admin Account
            </h1>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  placeholder="Your full name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-gray-700">
                  Phone Number *
                </Label>
                <Input
                  id="mobile_number"
                  placeholder="+8801XXXXXXXXX"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  className="bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  PIN Number *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full bg-primary text-white font-medium py-3 px-4 rounded-lg transition-opacity shadow-md ${
                isFormValid && !isLoading
                  ? "hover:opacity-90 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Processing..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a
                href="/signin"
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
