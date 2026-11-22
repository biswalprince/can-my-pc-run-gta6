const recipient = "biswalprince1@gmail.com";
const maxMessageLength = 2000;

type FeedbackPayload = {
  message?: unknown;
  email?: unknown;
  website?: unknown;
};

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as FeedbackPayload;

  if (typeof payload.website === "string" && payload.website.trim()) {
    return Response.json({ ok: true });
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (message.length < 10 || message.length > maxMessageLength) {
    return Response.json(
      { error: "Feedback must be between 10 and 2,000 characters." },
      { status: 400 },
    );
  }

  if (email && !isEmail(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_FROM_EMAIL;

  if (!apiKey || !from) {
    return Response.json({ error: "Feedback email is not configured." }, { status: 503 });
  }

  const emailText = [
    "New feedback from Can My PC Run GTA 6?",
    "",
    message,
    "",
    email ? "Reply to: " + email : "No reply email provided.",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email || undefined,
        subject: "Feedback for Can My PC Run GTA 6?",
        text: emailText,
      }),
    });

    if (!response.ok) {
      return Response.json({ error: "Feedback email could not be delivered." }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Feedback email could not be delivered." }, { status: 502 });
  }
}
