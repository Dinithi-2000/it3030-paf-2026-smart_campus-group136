import TicketsPage from "./TicketsPage";

export default function MyTicketsPage() {
  // Only show tickets created by the current user
  return <TicketsPage mode="user-my" />;
}
