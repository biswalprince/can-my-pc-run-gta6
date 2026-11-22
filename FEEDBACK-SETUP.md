# Feedback email setup

The feedback form sends messages to `biswalprince1@gmail.com` from the server
through [Resend](https://resend.com/). The API key is only read by the server;
never expose it in a `NEXT_PUBLIC_` variable or commit a real key.

1. Create a Resend API key with sending access.
2. Verify a sender domain in Resend and choose a `From` address on that domain.
3. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` and
   `FEEDBACK_FROM_EMAIL`.
4. Add the same values as server-side environment variables in the hosting
   provider, then redeploy.

The optional email field is used as the reply-to address. If delivery is not
configured or the email provider rejects a request, the form offers a direct
email link as a fallback.
