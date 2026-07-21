// LITTLE DAY — "Real AI planning" edge function.
// Deploy with: supabase functions deploy plan-day
// Set the secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// The Claude key lives ONLY here on the server — never in the app.

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { prefs, places } = await req.json();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content:
            `You are Little Day's planner. Given these preferences: ${JSON.stringify(prefs)} ` +
            `and these candidate places: ${JSON.stringify(places)}, choose an ordered itinerary ` +
            `of 2-4 stops with times. Respond ONLY with JSON: {"stops":[{"placeId":"...","time":9.5,"why":"..."}],"note":"..."}`,
        }],
      }),
    });
    const data = await r.json();
    const text = (data.content || []).map((c: any) => c.text || "").join("");
    return new Response(text.replace(/```json|```/g, "").trim(), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
