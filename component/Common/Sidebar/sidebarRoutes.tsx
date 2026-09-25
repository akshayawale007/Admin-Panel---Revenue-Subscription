import {
  UserIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  HomeModernIcon,
  SparklesIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

const sidebarRoutes = () => {
  const routes = [
    {
      title: "Latest changes",
      link: "/latest-changes/",
      icon: <ClockIcon className="w-5" />,
    },
    {
      title: "Revenue/Subscriptions",
      link: "/revenue/",
      icon: <CurrencyRupeeIcon className="w-5" />,
    },
    {
      title: "Subscriptions (Warden)",
      link: "/demo-subscription/",
      icon: <HomeModernIcon className="w-5" />,
    },
    {
      title: "Hostel",
      link: "/hostel/",
      icon: <HomeModernIcon className="w-5" />,
    },
    {
      title: "University/College",
      link: "/university/",
      icon: <BuildingLibraryIcon className="w-5" />,
    },
    {
      title: "Roles (Permissions)",
      link: "/roles/",
      icon: <ShieldCheckIcon className="w-5" />,
    },
    {
      title: "Modules (Routes)",
      link: "/page-routes/",
      icon: <Squares2X2Icon className="w-5" />,
    },
    {
      title: "Users",
      link: "/user/",
      icon: <UserIcon className="w-5" />,
    },
    {
      title: "Amenities",
      link: "/amenities/",
      icon: <SparklesIcon className="w-5" />,
    },
    {
      title: "Template",
      link: "/templates/",
      icon: <DocumentTextIcon className="w-5" />,
    },
  ]
  return {
    routes,
  }
}

export default sidebarRoutes
