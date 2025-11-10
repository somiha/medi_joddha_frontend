// hooks/use-user.ts
import { useEffect, useState } from "react";

export function useUser() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    console.log({ userData });
    if (userData) {
      const user = JSON.parse(userData);
      console.log({ user });
      setIsSuperAdmin(user.type === "super_admin"); // Match your API response
    }
  }, []);

  return { isSuperAdmin };
}
