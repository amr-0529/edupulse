"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { requestSessionAction, setMeetingLinkAction, submitFeedbackAction, reportUserAction } from "@/app/actions/sessions";
import { editSlotAction } from "@/app/actions/availability";
import { resolveReportAction, saveCategoryAction } from "@/app/actions/admin";
import { setAvatarAction } from "@/app/actions/profile";
import { FieldError, FormMessage, SubmitButton } from "@/components/ui";
import { Avatar } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";
import { initialState } from "@/lib/types";
import { formatSlt, durationMins } from "@/lib/format";
import { shrinkImage } from "@/lib/image";
import { validateAvatarFile, validateAvatarOutput, validateSlot, formErrors, sessionRequestSchema, feedbackSchema, reportSchema, meetingLinkSchema } from "@/lib/validation";
import { useClientValidation } from "@/components/useClientValidation";

export function SessionRequestPanel({ slots }: { slots: { id: string; starts_at: string; ends_at: string }[] }) {
  const [serverState, action] = useActionState(requestSessionAction, initialState);
  const cv = useClientValidation((fd) => formErrors(sessionRequestSchema, { slotId: fd.get("slotId") ?? "", topic: fd.get("topic") ?? "" }));
  const state = cv.merge(serverState);
  if (state.ok) return <p className="mt-3 text-sm font-semibold text-brand" role="status">{state.message}</p>;
  return (
    <form action={action} onSubmit={cv.onSubmit} noValidate className="mt-3">
      <fieldset>
        <legend className="label mt-0">Choose a time (Sri Lanka time)</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {slots.map((s, i) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-soft">
              <input type="radio" name="slotId" value={s.id} defaultChecked={i === 0 && slots.length === 1} />
              <span>{formatSlt(s.starts_at)} <span className="text-muted">· {durationMins(s.starts_at, s.ends_at)} min</span></span>
            </label>
          ))}
        </div>
        <FieldError state={state} name="slotId" />
      </fieldset>
      <label className="label" htmlFor="topic">What would you like to discuss?</label>
      <textarea id="topic" name="topic" rows={3} maxLength={500} className="input" />
      <FieldError state={state} name="topic" />
      <FormMessage state={state} />
      <SubmitButton className="mt-3" pending="Requesting…">Request session</SubmitButton>
    </form>
  );
}

export function MeetingLinkForm({ sessionId, current }: { sessionId: string; current: string | null }) {
  const [serverState, action] = useActionState(setMeetingLinkAction.bind(null, sessionId), initialState);
  const cv = useClientValidation((fd) => {
    const r = meetingLinkSchema.safeParse(String(fd.get("link") ?? ""));
    return r.success ? null : { link: r.error.issues[0].message };
  });
  const state = cv.merge(serverState);
  return (
    <form action={action} onSubmit={cv.onSubmit} noValidate className="mt-2">
      <div className="flex flex-wrap items-start gap-2">
        <input name="link" type="url" maxLength={300} defaultValue={current ?? ""} placeholder="https://meet.google.com/…" className="input max-w-md" />
        <SubmitButton className="btn-outline btn-sm" pending="Saving…">Save link</SubmitButton>
      </div>
      <FieldError state={state} name="link" />
      <FormMessage state={state} />
    </form>
  );
}

export function FeedbackForm({ sessionId }: { sessionId: string }) {
  const [serverState, action] = useActionState(submitFeedbackAction, initialState);
  const cv = useClientValidation((fd) => formErrors(feedbackSchema, { sessionId: fd.get("sessionId"), rating: fd.get("rating") ?? "", comment: fd.get("comment") ?? "" }));
  const state = cv.merge(serverState);
  return (
    <form action={action} onSubmit={cv.onSubmit} noValidate className="mt-3 rounded-xl border border-line p-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <fieldset>
        <legend className="text-sm font-semibold">How was this session?</legend>
        <div className="mt-1 flex gap-3">
          {[1, 2, 3, 4, 5].map((n) => <label key={n} className="flex items-center gap-1 text-sm"><input type="radio" name="rating" value={n} /> {n} ★</label>)}
        </div>
        <FieldError state={state} name="rating" />
      </fieldset>
      <textarea name="comment" rows={2} maxLength={500} className="input mt-2" placeholder="Comment (optional)" />
      <FieldError state={state} name="comment" />
      <FormMessage state={state} />
      <SubmitButton className="mt-3 btn-sm" pending="Saving…">Submit feedback</SubmitButton>
    </form>
  );
}

export function ReportUser({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [serverState, action] = useActionState(reportUserAction, initialState);
  const cv = useClientValidation((fd) => formErrors(reportSchema, { userId: fd.get("userId"), reason: fd.get("reason") ?? "" }));
  const state = cv.merge(serverState);
  if (state.ok) return <p className="text-sm font-semibold text-brand" role="status">{state.message}</p>;
  if (!open) return <button type="button" className="text-xs text-muted underline" onClick={() => setOpen(true)}>Report {name}</button>;
  return (
    <form action={action} onSubmit={cv.onSubmit} noValidate className="mt-2 rounded-xl border border-line p-3">
      <input type="hidden" name="userId" value={userId} />
      <textarea name="reason" rows={3} maxLength={500} className="input" placeholder={`Why are you reporting ${name}?`} />
      <FieldError state={state} name="reason" />
      <FormMessage state={state} />
      <div className="mt-2 flex gap-2">
        <SubmitButton className="btn-sm" pending="Sending…">Send report</SubmitButton>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

export function EditSlotForm({ slotId, date, start, end }: { slotId: string; date: string; start: string; end: string }) {
  const [open, setOpen] = useState(false);
  const [serverState, action] = useActionState(editSlotAction.bind(null, slotId), initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const state = clientError ? { ok: false, error: clientError } : serverState;
  if (!open) return <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>Edit</button>;
  return (
    <form action={action} noValidate onSubmit={(e) => {
      const fd = new FormData(e.currentTarget);
      const problem = validateSlot(String(fd.get("date")), String(fd.get("start")), String(fd.get("end")));
      if (problem) { e.preventDefault(); setClientError(problem); } else setClientError(null);
    }} className="flex flex-wrap items-end gap-2">
      <input name="date" type="date" defaultValue={date} className="input w-auto" required />
      <input name="start" type="time" defaultValue={start} className="input w-auto" required />
      <input name="end" type="time" defaultValue={end} className="input w-auto" required />
      <SubmitButton className="btn-sm" pending="Saving…">Save</SubmitButton>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Close</button>
      <div className="w-full"><FormMessage state={state} /></div>
    </form>
  );
}

export function ResolveReportForm({ reportId }: { reportId: string }) {
  const [state, action] = useActionState(resolveReportAction.bind(null, reportId), initialState);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-start gap-2">
      <input name="note" maxLength={500} placeholder="Resolution note (optional)" className="input max-w-md" />
      <SubmitButton className="btn-sm" pending="Saving…">Mark resolved</SubmitButton>
      <div className="w-full"><FieldError state={state} name="note" /><FormMessage state={state} /></div>
    </form>
  );
}

export function CategoryForm({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [state, action] = useActionState(saveCategoryAction.bind(null, id, active), initialState);
  const isNew = id === "new";
  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <input name="name" defaultValue={name} maxLength={60} placeholder={isNew ? "New category name" : undefined} className="input max-w-sm" />
      <SubmitButton className="btn-sm" pending="Saving…">{isNew ? "Add category" : "Rename"}</SubmitButton>
      <div className="w-full"><FieldError state={state} name="name" /><FormMessage state={state} /></div>
    </form>
  );
}

export function AvatarUploader({ userId, name, path }: { userId: string; name: string; path: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = validateAvatarFile(file.type, file.size);
    if (problem) return setMsg({ text: problem, bad: true });
    setBusy(true); setMsg(null);
    let upload: Blob = file;
    try { upload = await shrinkImage(file); } catch { if (file.size > 2 * 1024 * 1024) { setBusy(false); return setMsg({ text: "Image too large.", bad: true }); } }
    const tooBig = validateAvatarOutput(upload.size);
    if (tooBig) { setBusy(false); return setMsg({ text: tooBig, bad: true }); }
    const type = upload.type === "image/png" ? "image/png" : "image/jpeg";
    const newPath = `${userId}/${Date.now()}.${type === "image/png" ? "png" : "jpg"}`;
    const supabase = createClient();
    const up = await supabase.storage.from("avatars").upload(newPath, upload, { contentType: type, upsert: false });
    if (up.error) { setBusy(false); return setMsg({ text: "Upload failed.", bad: true }); }
    const res = await setAvatarAction(newPath);
    setBusy(false); setMsg({ text: res.error ?? res.message ?? "Photo updated.", bad: !!res.error });
    router.refresh();
  }
  return (
    <div className="card mb-4 flex max-w-xl flex-wrap items-center gap-4">
      <Avatar name={name} path={path} size={64} />
      <div>
        <p className="text-sm font-semibold">Profile photo</p>
        <label className="btn btn-outline btn-sm mt-2 cursor-pointer inline-block">
          {busy ? "Working…" : path ? "Change photo" : "Upload photo"}
          <input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={busy} onChange={onFile} />
        </label>
        {msg && <p className={`mt-2 text-sm font-semibold ${msg.bad ? "text-danger" : "text-brand"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}