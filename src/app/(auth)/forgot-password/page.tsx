"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const getBaseUrl = () => {
    return isSuperAdmin
      ? "https://api.t-coin.code-studio4.com/api/super-admin"
      : "https://api.t-coin.code-studio4.com/api/admins";
  };

  const handleSendOTP = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("OTP sent successfully.");
        setStep(2);
        setError("");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Network error. Try again.");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("OTP verified. Set your new PIN.");
        setStep(3);
        setError("");
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch {
      setError("Network error. Try again.");
    }
  };

  const handleResetPIN = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPinNumber: newPin }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("PIN reset successfully. Redirecting to login...");
        setError("");
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset PIN.");
      }
    } catch {
      setError("Network error. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200 rounded-xl">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-semibold text-center text-[#71113D]">
            Forgot PIN
          </h1>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="super-admin"
              checked={isSuperAdmin}
              onCheckedChange={(checked) => setIsSuperAdmin(!!checked)}
            />
            <Label htmlFor="super-admin">Super Admin</Label>
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleSendOTP}
                className="w-full bg-[#71113D] hover:bg-[#5a0f2f] text-white"
              >
                Send OTP
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button
                onClick={handleVerifyOTP}
                className="w-full bg-[#71113D] hover:bg-[#5a0f2f] text-white"
              >
                Verify OTP
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Label htmlFor="newPin">New PIN</Label>
              <Input
                id="newPin"
                type="password"
                placeholder="Enter New PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />
              <Button
                onClick={handleResetPIN}
                className="w-full bg-[#71113D] hover:bg-[#5a0f2f] text-white"
              >
                Reset PIN
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
