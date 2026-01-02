import { Metadata } from "next";
import AboutPage from "@/components/pageComponents/about";

export const metadata: Metadata = {
  "title": "About",
  "description": "Page: About"
};

export default function Page() {
  return <AboutPage />;
}
