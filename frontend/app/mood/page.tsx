"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { MoodLogsView } from "../../components/MoodLogsView";
import { getMoodHistory } from "../../lib/api";
import { getOrCreateAnonId } from "../../lib/storage";
import { MoodPoint } from "../../lib/types";

export default function MoodPage() {
  const { data: session } = useSession();
  const [moodHistory, setMoodHistory] = useState<MoodPoint[]>([]);

  const moodKey = useMemo(() => {
    if (session?.user) {
      return (session.user as { id?: string }).id ?? getOrCreateAnonId();
    }
    return getOrCreateAnonId();
  }, [session]);

  useEffect(() => {
    getMoodHistory(moodKey).then(setMoodHistory);
  }, [moodKey]);

  return (
    <main style={{ height: "100vh" }}>
      <MoodLogsView moodHistory={moodHistory} />
    </main>
  );
}
