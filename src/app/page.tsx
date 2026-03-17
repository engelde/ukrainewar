import AppShell from "@/components/layout/AppShell";
import { fetchCasualties } from "@/lib/api";

export default async function Home() {
  let casualtyData = null;

  try {
    casualtyData = await fetchCasualties();
  } catch (error) {
    console.error("Failed to fetch casualty data:", error);
  }

  return <AppShell casualtyData={casualtyData} />;
}
