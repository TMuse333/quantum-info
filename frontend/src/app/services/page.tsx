import { Metadata } from "next";
import ServicesPage from "@/components/pageComponents/services";

export const metadata: Metadata = {
  "title": "Services",
  "description": "Page: Services"
};

export default function Page() {
  return <ServicesPage />;
}
