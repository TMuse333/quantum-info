import { WebsiteMaster } from "./website";

// /types/user.ts

  
  export type SubscriptionStatus = "active" | "inactive" | "canceled" | null;
  
  export interface UserAccount {
    _id?: string;
    email: string;
    name?: string;
  
    // Payment & Subscription
    stripeCustomerId?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionId?: string | null;
    isHostingSubscriber: boolean;
  
    // Websites
    websites?: WebsiteMaster[];
  
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
  }
  
  export type UserWebsiteData = Omit<WebsiteMaster, "_id" | "ownerId" | "status"> & {
    createdAt: Date;
  }

