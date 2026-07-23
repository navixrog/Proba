import HomeClient from "@/components/HomeClient";
import { MOCK_MODE } from "@/lib/config";

export default function Home() {
  return <HomeClient mockMode={MOCK_MODE} />;
}
