import { NavLink, Outlet } from "react-router";
import { buttonVariants } from "~/common/components/ui/button";
import { cn } from "~/lib/utils";

const settingsNavLinks = [
    {
        name: "Profile",
        href: "/settings/profile",
    },
    {
        name: "Categories",
        href: "/settings/categories",
    },
    // Add other settings links here
];

export default function SettingsLayout() {
    return (
        <div className="max-w-7xl mx-auto py-12 px-4 pt-24 min-h-screen">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        {settingsNavLinks.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                end
                                className={({ isActive }: { isActive: boolean }) =>
                                    cn(
                                        buttonVariants({ variant: "ghost" }),
                                        isActive
                                            ? "bg-muted hover:bg-muted"
                                            : "hover:bg-transparent hover:underline",
                                        "justify-start"
                                    )
                                }
                            >
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-4xl">
                    <Outlet />
                </div>
            </div>
        </div>
    );
} 