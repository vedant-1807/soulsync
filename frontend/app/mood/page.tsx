import { MoodLogsView } from "../../components/MoodLogsView";

export const metadata = {
  title: "Mood Logs — SoulSync",
};

export default function MoodPage() {
  return (
    <main style={{ height: "100vh" }}>
      <MoodLogsView />
    </main>
  );
}
