import { Navigate } from "react-router-dom";
import { usePassword } from "@/contexts/PasswordContext";

export const PasswordProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAccessGranted } = usePassword();

  if (!isAccessGranted) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
