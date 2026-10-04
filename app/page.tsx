import { getDefaultEvent } from "@/lib/events";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const event = await getDefaultEvent();
  return <HomeClient event={event} />;
}