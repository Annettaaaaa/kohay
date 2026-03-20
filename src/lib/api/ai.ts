import { supabase } from "@/integrations/supabase/client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Please sign in to use this feature");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function extractLocation(url: string) {
  const { data, error } = await supabase.functions.invoke("extract-location", {
    body: { url },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.data;
}

type Msg = { role: "user" | "assistant"; content: string };

export async function streamTripPlanner({
  messages,
  savedPlaces,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  savedPlaces?: any[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const headers = await getAuthHeaders();

  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trip-planner`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, savedPlaces }),
    }
  );

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed (${resp.status})`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
