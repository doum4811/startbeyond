import { Link } from "react-router";
import { Separator } from "./ui/separator";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { cn } from "~/lib/utils";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { DropdownMenu } from "./ui/dropdown-menu";
import { BarChart3Icon, BellIcon, LogOutIcon, MessageCircleIcon, SettingsIcon, UserIcon, HomeIcon, CalendarDaysIcon, LineChartIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const menus = [
    {
        name: "Daily",
        to: "/daily",
        icon: HomeIcon,
    },
    {
        name: "Plan",
        to: "/plan",
        icon: CalendarDaysIcon,
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
            //     to: "/plan-quarterly"
            // },
            // {
            //     name: "Wishlist",
            //     description: "Plan for wishlist",
            //     to: "/wishlist"
            // }
            // {
            //     name: "Routine",
            //     description: "Plan for routine",
            //     to: "/routine"
            // }        
        ]
    },
    {
        name: "Stats",
        to: "/stats",
        icon: LineChartIcon,
    },
    {
        name: "Settings",
        to: "/settings",
        icon: SettingsIcon,
    },
]
export default function Navigation({    
    isLoggedIn,
        hasNotifications,
        hasMessages }: {   
            isLoggedIn: boolean, hasNotifications: boolean, hasMessages: boolean } 
) {
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
                                    <NavigationMenuTrigger className="flex items-center">
                                        {menu.icon && <menu.icon className="mr-2 h-4 w-4" />}
                                        {menu.name}
                                    </NavigationMenuTrigger>
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
                            </> : <Link className={navigationMenuTriggerStyle() + " flex items-center"} to={menu.to}>
                                {menu.icon && <menu.icon className="mr-2 h-4 w-4" />}
                                {menu.name}
                            </Link>}
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        </div>
        {isLoggedIn? 
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/my/notifications">
                <BellIcon className="size-4" />
                {/* {hasNotifications && <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">1</div>} */}
                {hasNotifications && <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></div>}
                </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/messages">
                <MessageCircleIcon className="size-4" />
                {hasMessages && <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></div>}
 
                </Link>
           </Button>
                    <DropdownMenu> 
            <DropdownMenuTrigger asChild>
                    <Avatar> 
                        <AvatarImage src="https://github.com/doum4811.png" />
                        <AvatarFallback>
                            N
                        </AvatarFallback>
                    </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="font-medium">John Doe</span>
                    <span className="text-xs text-muted-foreground">@username</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/my/dashboard">
                    <BarChart3Icon className="size-4 mr-2" />
                    Dashboard</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/my/profile">
                    <UserIcon className="size-4 mr-2" />
                    Profile</Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/my/settings">
                    <SettingsIcon className="size-4 mr-2" />
                    Settings</Link>
                </DropdownMenuItem> */}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/auth/logout">
                    <LogOutIcon className="size-4 mr-2" />
                    Logout</Link>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
        </div>
        :<div className="flex items-center gap-4">
                <Button asChild variant="secondary">
                    <Link to="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                    <Link to="/auth/join">Join</Link>
                </Button>
            </div>} 
    </nav>;
}
