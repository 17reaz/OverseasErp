import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    path: "/app",
  },
  {
    label: "Candidates",
    path: "/app/candidates",
  },
  {
    label: "Medical",
    path: "/app/medical",
  },
  {
    label: "MOFA",
    path: "/app/mofa",
  },
  {
    label: "Visa",
    path: "/app/visa",
  },
  {
    label: "Flight",
    path: "/app/flight",
  },
];

export function ErpSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="font-semibold">
          Overseas ERP
        </h1>
      </div>

      <nav className="space-y-1 p-3">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/app"}
            className={({ isActive }) =>
              [
                "block rounded-md px-3 py-2 text-sm",
                isActive
                  ? "bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}