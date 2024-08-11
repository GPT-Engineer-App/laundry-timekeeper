import { Home, Calendar } from "lucide-react";
import Login from "./pages/Login.jsx";
import Booking from "./pages/Booking.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Login",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Login />,
  },
  {
    title: "Booking",
    to: "/booking",
    icon: <Calendar className="h-4 w-4" />,
    page: <Booking />,
  },
];
