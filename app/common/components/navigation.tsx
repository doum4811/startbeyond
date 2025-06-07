import { Link } from "react-router";
import { Separator } from "./ui/separator";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { cn } from "~/lib/utils";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { DropdownMenu } from "./ui/dropdown-menu";
import { BarChart3Icon, BellIcon, LogOutIcon, MessageCircleIcon, SettingsIcon, UserIcon, HomeIcon, CalendarDaysIcon, LineChartIcon, MenuIcon, X as CloseIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetFooter } from "./ui/sheet";

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
    // {
    //     name: "Stats-old",
    //     to: "/stats-old",
    //     icon: LineChartIcon,
    // },
    {
        name: "Stats",
        to: "/stats/summary",
        icon: LineChartIcon,
        items: [
            {
                name: "summary",
                description: "월간 요약 통계",
                to: "/stats/summary"
            },
            {
                name: "records",
                description: "기록 검색",
                to: "/stats/records"
            },
            {
                name: "category",
                description: "카테고리별 상세 통계",
                to: "/stats/category"
            },
            {
                name: "advanced",
                description: "히트맵, 시간대별 분석 등",
                to: "/stats/advanced"
            }, 
        ]
    },
    {
        name: "Community",
        to: "/community",
        icon: MessageCircleIcon,
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
    hasMessages,
    username,
    avatar,
    name,
}: {   
            isLoggedIn: boolean, 
            hasNotifications: boolean, hasMessages: boolean,    
            username?: string;
            avatar?: string | null;
            name?: string;
        } 
) { return (
    <Sheet>
      {/* Mobile Navbar */}
      <nav className="flex md:hidden px-5 h-16 items-center justify-between fixed top-0 left-0 right-0 bg-background/70 backdrop-blur z-50">
        <Link to="/" className="text-lg font-bold">StartBeyond</Link>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
      </nav>

      {/* Desktop Navbar */}
      <nav className="hidden md:flex px-8 h-16 items-center justify-between fixed top-0 left-0 right-0 bg-background/70 backdrop-blur z-50">
    {/* return <nav className="flex px-20 h-16 items-center justify-between backdrop-blur fixed top-0 left-0 right-0 z-50 bg-background/70"> */}
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
                <Link to="/notifications">
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
                        {/* <AvatarImage src="https://github.com/doum4811.png" />
                        <AvatarFallback>
                            N
                        </AvatarFallback> */}
                        {avatar ? (
                            <AvatarImage src={avatar} />
                            ) : (
                            <AvatarFallback>{name?.[0]}</AvatarFallback>
                         )}
                    </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                    {/* <span className="font-medium">John Doe</span>
                    <span className="text-xs text-muted-foreground">@username</span> */}
                    <span className="font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                        @{username}
                    </span> 
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/my/dashboard">
                    <BarChart3Icon className="size-4 mr-2" />
                    Dashboard</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={`/users/${username}`}>
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
    </nav>

      {/* Mobile Sheet Menu */}
      <SheetContent className="mt-16 p-4 flex flex-col justify-between h-[calc(100vh-4rem)]">
        {/* <SheetClose asChild>
          <Button variant="ghost" size="icon" className="self-end">
            <CloseIcon className="h-6 w-6" />
          </Button>
        </SheetClose> */}
        <div className="space-y-2">
          {menus.map((menu) =>
            menu.items ? (
              <Accordion key={menu.name} type="single" collapsible>
                <AccordionItem value={menu.name}>
                  <AccordionTrigger className="py-2 text-base font-medium">{menu.name}</AccordionTrigger>
                  <AccordionContent className="pl-4">
                    {menu.items.map((item) => (
                      <Link key={item.name} to={item.to} className="block py-2 text-sm hover:underline">
                        {item.name} →
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <Link key={menu.name} to={menu.to} className="block py-3 text-base font-medium hover:underline">
                {menu.name} →
              </Link>
            )
          )}
        </div>
        <SheetFooter className="border-t pt-4 flex justify-around">
          {isLoggedIn ? (
            <>
              <Link to="/notifications" className="relative">
                <BellIcon className="h-5 w-5" />
                {hasNotifications && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />}
              </Link>
              <Link to="/messages" className="relative">
                <MessageCircleIcon className="h-5 w-5" />
                {hasMessages && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />}
              </Link>
              <Link to={`/users/${username}`}>
                <Avatar>
                  {avatar ? <AvatarImage src={avatar} /> : <AvatarFallback>{name?.[0]}</AvatarFallback>}
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="text-sm font-medium">Login</Link>
              <Link to="/auth/join" className="text-sm font-medium">Join</Link>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}