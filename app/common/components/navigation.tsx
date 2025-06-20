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
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "react-i18next";

const menuKeys = [
    {
        name: "daily",
        to: "/daily",
        icon: HomeIcon,
    },
    {
        name: "plan",
        to: "/plan",
        icon: CalendarDaysIcon,
        items: [
            { name: "plan_tomorrow", to: "/plan/tomorrow" },
            { name: "plan_weekly", to: "/plan/weekly" },
            { name: "plan_monthly", to: "/plan/monthly" },
        ]
    },
    {
        name: "stats",
        to: "/stats/summary",
        icon: LineChartIcon,
        items: [
            { name: "stats_summary", to: "/stats/summary" },
            { name: "stats_records", to: "/stats/records" },
            { name: "stats_category", to: "/stats/category" },
            { name: "stats_advanced", to: "/stats/advanced" }, 
        ]
    },
    { name: "community", to: "/community", icon: MessageCircleIcon },
    { name: "settings", to: "/settings", icon: SettingsIcon },
];

const profileMenuKeys = [
    { name: "profile", to: (username?: string) => `/users/${username}`, icon: UserIcon },
    // { name: "settings", to: () => `/settings`, icon: SettingsIcon },
    { name: "logout", to: () => "/auth/logout", icon: LogOutIcon },
];

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
        }) { 
    const { t } = useTranslation();
    const menus = menuKeys.map(menu => ({
        ...menu,
        name: t(`nav.${menu.name}`),
        items: menu.items?.map(item => ({
            ...item,
            name: t(`nav.${item.name}`),
            description: t(`nav.${item.name}_desc`)
        }))
    }));
    const profileMenus = profileMenuKeys.map(item => ({
        ...item,
        name: t(`nav.${item.name}`),
    }));

    return (
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
            {isLoggedIn && <>
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
            </>}
        </div>
        {isLoggedIn? 
        <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/notifications">
                    <BellIcon className="h-5 w-5" />
                {hasNotifications && <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></div>}
                </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/messages">
                    <MessageCircleIcon className="h-5 w-5" />
                {hasMessages && <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></div>}
                </Link>
           </Button>
                    <DropdownMenu> 
            <DropdownMenuTrigger>
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
                {profileMenus.map((item) => (
                    <DropdownMenuItem key={item.name} asChild className="cursor-pointer">
                        <Link to={item.to(username)} className="flex items-center">
                            <item.icon className="size-4 mr-2" />
                            {item.name}
                        </Link>
                </DropdownMenuItem>
                ))}

            </DropdownMenuContent>
        </DropdownMenu>
        </div>
        :<div className="flex items-center gap-4">
                <LanguageSwitcher />
                <Button asChild variant="secondary">
                    <Link to="/auth/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                    <Link to="/auth/join">{t('nav.join')}</Link>
                </Button>
            </div>} 
    </nav>

      {/* Mobile Sheet Menu */}
      <SheetContent side="right" className="w-full max-w-sm flex flex-col">
        <SheetClose asChild>
            <Link to="/" className="text-lg font-bold p-4">StartBeyond</Link>
        </SheetClose>
        {isLoggedIn && <div className="mt-8 overflow-y-auto flex-grow">
            <Accordion type="single" collapsible className="w-full">
                {menus.map((menu) => (
            menu.items ? (
                        <AccordionItem value={menu.name} key={menu.name}>
                            <AccordionTrigger className="text-base font-medium py-3 px-4">
                                <Link to={menu.to} className="flex items-center">
                                    {menu.icon && <menu.icon className="mr-3 h-5 w-5" />}
                                    {menu.name}
                      </Link>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="pl-8 space-y-2 py-2 px-4">
                                    {menu.items.map(item => (
                                        <li key={item.name}>
                                            <SheetClose asChild>
                                                <Link to={item.to} className="text-muted-foreground hover:text-foreground block">{item.name}</Link>
                                            </SheetClose>
                                        </li>
                    ))}
                                </ul>
                  </AccordionContent>
                </AccordionItem>
            ) : (
                        <SheetClose asChild key={menu.name}>
                            <Link to={menu.to} className="flex items-center text-base font-medium py-3 border-b px-4">
                                {menu.icon && <menu.icon className="mr-3 h-5 w-5" />}
                                {menu.name}
              </Link>
                        </SheetClose>
            )
                ))}
            </Accordion>
        </div>}
        <SheetFooter className="mt-auto pt-4 border-t">
          {isLoggedIn ? (
            <div className="flex justify-between w-full items-center">
              <SheetClose asChild>
                <Link to={`/users/${username}`} className="flex items-center gap-2 overflow-hidden">
                  <Avatar>
                    {avatar ? <AvatarImage src={avatar} /> : <AvatarFallback>{name?.[0]}</AvatarFallback>}
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-sm text-muted-foreground truncate">@{username}</div>
                  </div>
                </Link>
              </SheetClose>
              <div className="flex items-center">
                <SheetClose asChild>
                    <Button variant="ghost" size="icon" asChild className="relative">
                        <Link to="/notifications">
                            <BellIcon className="h-5 w-5" />
                        {hasNotifications && <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></div>}
                        </Link>
                    </Button>
                </SheetClose>
                <SheetClose asChild>
                    <Button variant="ghost" size="icon" asChild className="relative">
                        <Link to="/messages">
                            <MessageCircleIcon className="h-5 w-5" />
                        {hasMessages && <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></div>}
                        </Link>
                   </Button>
                </SheetClose>
                <LanguageSwitcher />
              </div>
            </div>
          ) : (
            <div className="flex items-center w-full gap-2">
                <Button asChild variant="secondary" className="flex-1">
                    <SheetClose asChild><Link to="/auth/login">{t('nav.login')}</Link></SheetClose>
                </Button>
                <Button asChild className="flex-1">
                    <SheetClose asChild><Link to="/auth/join">{t('nav.join')}</Link></SheetClose>
                </Button>
                <LanguageSwitcher />
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}