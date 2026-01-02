import { BaseColorProps } from "./componentTypes";

export type NavItemType = "link" | "scroll" | "submenu" | "external";

export interface NavItem {
  type: NavItemType;
  label: string;
  href?: string; // for link/external
  scrollTo?: string; // for scroll (component id)
  target?: "_blank"; // for external
  children?: NavItem[]; // for submenu
}


export interface StandardTab {
    name:string,
    href:string
}


export interface NavbarProps extends BaseColorProps {
    logoSrc?: string;
    logoAlt?:string
    logoText?: string;
    tabs: NavItem[];
    sticky?: boolean;
    alignment?: "left" | "center" | "right";
    ctaDestination?: string;
    buttonText?: string;
  }
  export interface FooterContact {
    address?: string;
    phone?: string;
    email?: string;
    contactLink?: string;
  }

  export interface BaseFooterProps {
    logoSrc?: string;
    logoAlt?:string
    brandName?: string;
    contact?:FooterContact
    navItems?: StandardTab[];
    socialLinks?: { name: string; href: string; icon: React.ElementType }[];
    developerCredit?:StandardTab;
  }
  
  