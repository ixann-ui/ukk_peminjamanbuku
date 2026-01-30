// components/student/Layout.js
import StudentSidebar from "./Sidebar";

const StudentLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <StudentSidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden md:ml-[260px]">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
