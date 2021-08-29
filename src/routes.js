/*!

=========================================================
* Material Dashboard React - v1.10.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
// @material-ui/icons
import Dashboard from "@material-ui/icons/Dashboard";
import Map from "@material-ui/icons/Map";
import LibraryBooks from "@material-ui/icons/LibraryBooks";
import BubbleChart from "@material-ui/icons/BubbleChart";
import Notifications from "@material-ui/icons/Notifications";
import Unarchive from "@material-ui/icons/Unarchive";
// core components/views for Admin layout
import DashboardPage from "views/Dashboard/Dashboard.js";
import MapPage from "views/MapPage/MapPage.js";
import TableList from "views/TableList/TableList.js";
import Typography from "views/Typography/Typography.js";
import Icons from "views/Icons/Icons.js";
import NotificationsPage from "views/Notifications/Notifications.js";
import UpgradeToPro from "views/UpgradeToPro/UpgradeToPro.js";
import {Business, SentimentVeryDissatisfied} from "@material-ui/icons";
import WarsView from "./views/Wars/Wars";
import FactoryPage from "./views/Factories/FactoryPage";

const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: Dashboard,
    component: DashboardPage,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/map",
    name: "Map",
    icon: Map,
    component: MapPage,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/wars",
    name: "Wars",
    icon: SentimentVeryDissatisfied,
    component: WarsView,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/factory",
    name: "Factory",
    icon: Business,
    component: FactoryPage,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/table",
    name: "Table List",
    icon: "content_paste",
    component: TableList,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/typography",
    name: "Typography",
    icon: LibraryBooks,
    component: Typography,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/icons",
    name: "Icons",
    icon: BubbleChart,
    component: Icons,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/notifications",
    name: "Notifications",
    icon: Notifications,
    component: NotificationsPage,
    layout: "/victoria-save-analysis",
  },
  {
    path: "/upgrade-to-pro",
    name: "Upgrade To PRO",
    icon: Unarchive,
    component: UpgradeToPro,
    layout: "/victoria-save-analysis",
  },
];

export default dashboardRoutes;
