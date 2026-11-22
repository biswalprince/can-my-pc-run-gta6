"use client";

import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "sending" | "success" | "error";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionState("sending");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email, website }),
      });

      if (!response.ok) {
        throw new Error("Feedback could not be sent.");
      }

      setMessage("");
      setEmail("");
      setWebsite("");
      setSubmissionState("success");
    } catch {
      setSubmissionState("error");
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Your feedback <b>*</b></span>
        <textarea
          name="message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSubmissionState("idle");
          }}
          placeholder="What could we improve?"
          minLength={10}
          maxLength={2000}
          rows={6}
          required
        />
        <small>10–2,000 characters. Please don’t include sensitive information.</small>
      </label>
      <label className="field">
        <span>Email <i>(optional, if you’d like a reply)</i></span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSubmissionState("idle");
          }}
          placeholder="you@example.com"
        />
      </label>
      <label className="feedback-honeypot" aria-hidden="true">
        Leave this field empty
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </label>
      <p className="feedback-privacy">Your message and optional email are sent to the project owner by email.</p>
      <button className="submit-button" type="submit" disabled={submissionState === "sending"}>
        {submissionState === "sending" ? "SENDING FEEDBACK…" : "SEND FEEDBACK"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="feedback-status" role="status" aria-live="polite">
        {submissionState === "success" && "Thanks — your feedback has been sent."}
        {submissionState === "error" && (
          <>We couldn’t send that right now. You can email <a href="mailto:biswalprince1@gmail.com">biswalprince1@gmail.com</a> instead.</>
        )}
      </p>
    </form>
  );
}
