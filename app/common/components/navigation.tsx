import { Link } from "react-router";
import { Separator } from "./ui/separator";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { cn } from "~/lib/utils";

const menus = [
    {
        name: "Daily",
        to: "/daily",
    },
    {
        name: "Plan",
        to: "/plan",
        items: [
            {
                name: "Tomorrow",
                description: "Plan for tomorrow",
                to: "/plan/tomorrow"
            },
            {
                name: "Weekly",
                description: "Plan for weekly",
                to: "/plan/weekly"
            },
            {
                name: "Monthly",
                description: "Plan for monthly",
                to: "/plan/monthly"
            },
            // {
            //     name: "Quarterly",
            //     description: "Plan for quarterly",
            //     to: "/plan/quarterly"
            // },
            // {
            //     name: "Wishlist",
            //     description: "Plan for wishlist",
            //     to: "/wishlist"
            // }
        ]
    },
    {
        name: "Stats",
        to: "/stats",
    },
    {
        name: "Settings",
        to: "/settings",
    },
]
export default function Navigation() {
    return <nav className="flex px-20 h-16 items-center justify-between backdrop-blur fixed top-0 left-0 right-0 z-50 bg-background/70">
        <div className="flex items-center gap-2">
            <Link to="/" className="font-bold tracking-tight text-lg">StartBeyond</Link>
            <Separator orientation="vertical" className="h-6 mx-4" />
            <NavigationMenu>
                <NavigationMenuList>
                    {menus.map((menu) => (
                        <NavigationMenuItem key={menu.name} className="select-none rounded-md transition-colors 
                        focus:bg-accent hover:bg-accent">
                            {menu.items ? <>
                                <Link to={menu.to}>
                                    <NavigationMenuTrigger>{menu.name}</NavigationMenuTrigger>
                                </Link>
                                <NavigationMenuContent>
                                    <ul className="grid w-[500px] font-light gap-3 p-4 grid-cols-2">
                                        {menu.items?.map((item) => (
                                            <NavigationMenuItem
                                                key={item.name}
                                            // className={cn([
                                            //     "select-none rounded-md transition-colors focus:bg-accent hover:bg-accent",
                                            //     (item.to === "/products/promote" || item.to === "/jobs/submit") && "col-span-2 bg-primary/10 hover:bg-primary/20 focus:bg-primary/20",
                                            // ])}
                                            >
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        className="p-3 space-y-1 block leading-none no-underline outline-none"
                                                        to={item.to}>
                                                        <span className="text-sm font-medium leading-none">{item.name}</span>
                                                        <p className="text-sm leading-none text-muted-foreground">{item.description}</p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </NavigationMenuItem>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </> : <Link className={navigationMenuTriggerStyle()} to={menu.to}>{menu.name}</Link>}
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    </nav>;
}
