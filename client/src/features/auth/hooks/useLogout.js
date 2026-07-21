import { useNavigate } from "react-router";
import { useAuth } from "../../../features/auth/components/AuthContext.jsx";

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  };

  return handleLogout;
}
