"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";

interface CountData {
  totalUsers?: number;
  totalAgents?: number;
  totalInvestors?: number;
  totalCountries?: number;
  totalTCoins?: number;
  todayWithdraw?: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: []; // Adjust this type based on your actual data structure
}

export default function Dashboard() {
  const [counts, setCounts] = useState<CountData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;

        if (!token) {
          console.error("No token found");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Fetch all data in parallel
        const [usersRes, agentsRes, projectsRes, countriesRes] =
          await Promise.all([
            fetch("https://api.t-coin.code-studio4.com/api/users", { headers }),
            fetch("https://api.t-coin.code-studio4.com/agents"),
            fetch(
              "https://api.t-coin.code-studio4.com/api/investment-projects"
            ),
            fetch("https://api.t-coin.code-studio4.com/api/country"),
          ]);

        // Parse responses
        const usersData: ApiResponse = await usersRes.json();
        const agentsData: ApiResponse = await agentsRes.json();
        const projectsData: ApiResponse = await projectsRes.json();
        const countriesData: ApiResponse = await countriesRes.json();

        // Get TCoins from localStorage
        const tcoinBalance =
          typeof window !== "undefined"
            ? localStorage.getItem("tcoin_balance") || "0"
            : "0";

        // Calculate today's withdraw (this would need actual API endpoint)
        const todayWithdraw = 0; // Replace with actual API call if available

        setCounts({
          totalUsers: usersData.data?.length || 0,
          totalAgents: agentsData.data?.length || 0,
          totalInvestors: projectsData.data?.length || 0,
          totalCountries: countriesData.data?.length || 0,
          totalTCoins: parseInt(tcoinBalance),
          todayWithdraw,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              </div>
              <div className="grid md:gap-x-4 lg:gap-x-12 gap-y-4 max-[1219px]:grid-cols-2 min-[1220px]:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card
                    key={i}
                    className="min-w-72 h-40 py-4 gap-4 border-[#3971C1] animate-pulse"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-6 w-24 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Main Content */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            {/* Dashboard Header */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>

            {/* Data Cards Grid */}
            <div className="grid md:gap-x-4 lg:gap-x-12 gap-y-4 max-[1219px]:grid-cols-2 min-[1220px]:grid-cols-3">
              <Card className="min-w-72 h-40 py-4 gap-4 border-[#3971C1]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    Total
                    <br />
                    Users
                  </CardTitle>
                  <Image
                    src="/person-fill.png"
                    alt="person-fill"
                    width={30}
                    height={30}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {counts.totalUsers?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
