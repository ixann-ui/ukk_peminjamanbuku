// components/admin/Layout.js
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden md:ml-[260px]">
        {children}
      </main>
    </div>
  );
};

export default Layout;
