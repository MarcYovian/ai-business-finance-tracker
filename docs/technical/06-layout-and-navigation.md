# 🔧 Technical: Layout and Navigation

## 1. Overview

The application's layout is managed by the `Layout` component located at `src/components/Layout.tsx`. This component is responsible for providing a consistent and responsive structure across all protected pages of the application.

---

## 2. Responsive Design

The `Layout` component uses the `useIsMobile` hook (`src/hooks/use-mobile.tsx`) to adapt its structure for different screen sizes, providing an optimal user experience on both desktop and mobile devices.

### a. Desktop Layout

On larger screens, the layout consists of a fixed-width sidebar on the left and a main content area on the right.

- **Sidebar**: A `256px` wide sidebar is always visible on the left, providing access to the main navigation links.
- **Main Content**: The rest of the screen is dedicated to the page's content, with appropriate padding.

### b. Mobile Layout

On smaller screens, the sidebar is hidden by default to maximize space for the content. It can be accessed as a slide-out sheet.

- **Header**: A sticky header at the top contains a menu button (hamburger icon) to open the sidebar, the application title, and a spacer.
- **Sheet-based Sidebar**: Clicking the menu button opens a `Sheet` component (from `shadcn/ui`) that slides in from the left, revealing the navigation links.
- **Main Content**: The content is displayed below the header.

---

## 3. Navigation

Navigation is handled by the `SidebarNav` component within `Layout.tsx`.

### a. Navigation Items

The main navigation links are defined in the `navItems` array within `Layout.tsx`. Each item has a `path`, a `label`, and an `icon`.

```javascript
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: Target },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { path: '/settings', label: 'Settings', icon: Settings },
];
```

### b. Active State

The `SidebarNav` component uses the `useLocation` hook from `react-router-dom` to determine the current path. The link corresponding to the active path is highlighted with a `secondary` variant to provide clear visual feedback to the user.

### c. Logout

The sidebar also includes a **Logout** button that calls the `logout` function from the `useAuth` context and redirects the user to the home page.
