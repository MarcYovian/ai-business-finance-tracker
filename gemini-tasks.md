# Project: Refactor Application for Mobile-First Responsive Design and Improved UI/UX

## 1. High-Level Goal

I need you to act as an expert UI/UX designer and senior frontend developer. Your task is to refactor the entire React application to be fully responsive, adopting a **mobile-first design philosophy**.

The current application has a static, desktop-centric layout that is not usable on mobile devices. The goal is to create a seamless, intuitive, and aesthetically pleasing user experience across all screen sizes, from small phones to large desktop monitors.

## 2. Problem Description

The primary issues with the current codebase are:

1.  **Static Layout:** The main layout component (`src/components/Layout.tsx`) uses a fixed-width sidebar (`w-64`) which does not adapt to smaller viewports, causing content to be pushed off-screen or become squished.
2.  **Desktop-First Grids:** Pages like `Dashboard.tsx` use multi-column grids (e.g., `md:grid-cols-3`) that are not configured to stack vertically on smaller screens, making them unusable on mobile.
3.  **Poor Mobile Experience:** Forms, tables, and dialogs across the application are not optimized for touch input or small screens, leading to a frustrating user experience.
4.  **Lack of Responsive Navigation:** There is no mobile-friendly navigation mechanism like a "hamburger" menu or a slide-out drawer.

## 3. Required Changes & Instructions

You must refactor the application, focusing on the files below, to implement a fluid, responsive design.

### Step 1: Create a Responsive Main Layout (`src/components/Layout.tsx`)

This is the most critical part of the refactor. The entire navigation structure needs to be rebuilt to be responsive.

1.  **Detect Screen Size:** Use the existing `useIsMobile` hook (`src/hooks/use-mobile.tsx`) to conditionally render different layouts for mobile and desktop.
2.  **Mobile View (`isMobile === true`):**
    - The main sidebar (`<aside>`) should be **hidden by default**.
    - Create a new, simple **header component** at the top of the main content area.
    - This header should contain a "hamburger" menu icon button (`Menu` from `lucide-react`).
    - When the hamburger button is clicked, it should open a **slide-out drawer** (`Sheet` component from `shadcn/ui`).
    - The `Sheet` component must contain the navigation links that are currently in the desktop sidebar (`navItems`). Each link should be clearly visible and tappable.
3.  **Desktop View (`isMobile === false`):**
    - The existing layout with the visible, fixed-width sidebar should be maintained as it is already suitable for larger screens.
4.  **Refactor Navigation:** The `navItems` array and mapping logic should be extracted so it can be reused in both the desktop sidebar and the mobile `Sheet` to avoid code duplication.

### Step 2: Make Dashboard Grids Responsive (`src/pages/Dashboard.tsx`)

Update the dashboard to ensure all elements are clearly visible and usable on a single-column mobile layout.

1.  **Key Metrics Grid:** Modify the 3-column grid to stack vertically on mobile. Change the Tailwind classes from `md:grid-cols-3` to something like `grid grid-cols-1 gap-4 md:grid-cols-3`.
2.  **Charts Grid:** Modify the 2-column grid for "Expense Breakdown" and "Recent Transactions" to also stack vertically on mobile. Use classes like `grid grid-cols-1 gap-4 lg:grid-cols-2`.
3.  **Chart Sizes:** Ensure the `ResponsiveContainer` for the charts functions correctly and doesn't cause horizontal overflow on small screens.

### Step 3: Adapt Other Pages for Mobile (`Transactions.tsx`, `Settings.tsx`)

Review and refactor other pages to ensure a consistent and user-friendly mobile experience.

1.  **In `Settings.tsx`:**
    - The form for adding a new "Fund Source" has two input fields side-by-side. Make this layout wrap into a vertical stack on mobile screens.
    - Ensure the `Tabs` component from `shadcn/ui` is responsive and easy to use on mobile.
2.  **In `Transactions.tsx`:**
    - Review the layout for each transaction item in the list. While the current flex layout might be acceptable, ensure that long descriptions or details do not cause horizontal overflow. Adjust the layout if necessary to stack details vertically on smaller screens.
3.  **In `TransactionDialog.tsx` & `TransferDialog.tsx`:**
    - Verify that these dialogs are fully responsive. The content should fit comfortably within the viewport on a mobile device without requiring horizontal scrolling. `shadcn/ui` dialogs are generally good, but confirm the content within them is also fluid.

### Step 4: General UI/UX Polish

Apply small but important touches to improve the overall experience.

1.  **Padding and Spacing:** Add appropriate padding to the main content wrapper on mobile to ensure content doesn't touch the screen edges (e.g., `p-4` instead of `p-8` on mobile).
2.  **Tap Targets:** Ensure all interactive elements like buttons and inputs are large enough to be easily tapped on a mobile device.

---

## 5. Final Output

Please provide the complete, refactored code for all the modified files, which should primarily include:

- **`src/components/Layout.tsx`** (with the new responsive logic)
- **`src/pages/Dashboard.tsx`**
- **`src/pages/Settings.tsx`**
- **`src/pages/Transactions.tsx`**
- Any other components that required adjustments for responsiveness.

The final application must be fully responsive and offer a premium user experience on both mobile and desktop.
