import { Metadata } from "next";
import HomePage from "@/components/pageComponents/index";

export const metadata: Metadata = {
  "title": "Home",
  "description": "Page: Home"
};

export default function Page() {
  return <HomePage />;
}
