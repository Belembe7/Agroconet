"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { browserApi } from "@/lib/browser-api";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
  user: { name: string };
  _count: { messages: number };
};
type Thread = {
  id: string;
  updatedAt: string;
  subject: string;
  status: string;
  messages: {
    id: string;
    userId: string;
    body: string;
    isAdmin: boolean;
    createdAt: string;
    user: { name: string };
  }[];
};

export function SupportChat({
  admin = false,
  userId,
  locale = "pt",
}: {
  admin?: boolean;
  userId: string;
  locale?: string;
}) {
  const en = locale === "en";
  const labels: Record<string, string> = en
    ? { OPEN: "Open", IN_PROGRESS: "In progress", RESOLVED: "Resolved" }
    : { OPEN: "Aberto", IN_PROGRESS: "Em atendimento", RESOLVED: "Resolvido" };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const refreshList = useCallback(async () => {
    const data = await browserApi<{ tickets: Ticket[] }>("/api/apoio");
    setTickets(data.tickets);
    setLoading(false);
  }, []);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        await refreshList();
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          setLoading(false);
        }
      } finally {
        if (alive) timer = setTimeout(refresh, 5000);
      }
    };
    void refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [refreshList]);
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const data = await browserApi<Thread>(
          `/api/apoio?ticketId=${selectedId}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted)
          setThread((current) =>
            current?.id === data.id && current.updatedAt > data.updatedAt
              ? current
              : data,
          );
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 5000);
      }
    };
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [selectedId]);
  const lastMessage = thread?.messages.at(-1)?.id;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [lastMessage]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await browserApi<{ id: string }>("/api/apoio", {
        method: "POST",
        body: JSON.stringify({
          ticketId: selectedId ?? undefined,
          subject: selectedId ? undefined : subject,
          body,
        }),
      });
      setBody("");
      setSubject("");
      setSelectedId(result.id);
      setThread(await browserApi<Thread>(`/api/apoio?ticketId=${result.id}`));
      await refreshList();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function statusChange(status: string) {
    setBusy(true);
    setError("");
    try {
      await browserApi("/api/apoio", {
        method: "PATCH",
        body: JSON.stringify({ ticketId: selectedId, status }),
      });
      setThread(await browserApi<Thread>(`/api/apoio?ticketId=${selectedId}`));
      await refreshList();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function select(id: string | null) {
    setSelectedId(id);
    setThread(null);
    setBody("");
    setError("");
  }

  return (
    <section
      className="support-workspace"
      aria-label={en ? "Support chat" : "Chat de apoio"}
    >
      <aside className="support-sidebar">
        <div className="support-sidebar-heading">
          <MessageCircle aria-hidden="true" />
          <h2>
            {admin
              ? "Caixa de entrada"
              : en
                ? "Your conversations"
                : "As suas conversas"}
          </h2>
        </div>
        {!admin && (
          <button
            type="button"
            className="service-button"
            onClick={() => select(null)}
            disabled={busy}
          >
            <Plus className="size-4" />
            {en ? "New question" : "Nova dúvida"}
          </button>
        )}
        {loading && (
          <p role="status">
            {en ? "Loading conversations…" : "A carregar conversas…"}
          </p>
        )}
        {!loading && !tickets.length && (
          <p className="service-muted">
            {admin
              ? "Ainda não há pedidos de apoio."
              : en
                ? "Send your first question to our team."
                : "Envie a sua primeira dúvida à equipa."}
          </p>
        )}
        <ul className="support-ticket-list">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                disabled={busy}
                aria-pressed={selectedId === ticket.id}
                onClick={() => select(ticket.id)}
              >
                <strong>{ticket.subject}</strong>
                {admin && <span>{ticket.user.name}</span>}
                <span
                  className={`support-status status-${ticket.status.toLowerCase()}`}
                >
                  {labels[ticket.status]}
                </span>
                <small>
                  {new Date(ticket.updatedAt).toLocaleString(
                    en ? "en-GB" : "pt-MZ",
                  )}{" "}
                  · {ticket._count.messages} {en ? "messages" : "mensagens"}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="support-conversation">
        <header className="support-chat-header">
          <div>
            <p className="guide-eyebrow">
              AGROCONET · {en ? "CUSTOMER SUPPORT" : "ATENDIMENTO"}
            </p>
            <h2>
              {thread?.subject ??
                (selectedId
                  ? en
                    ? "Loading…"
                    : "A carregar…"
                  : admin
                    ? "Seleccione uma conversa"
                    : en
                      ? "How can we help?"
                      : "Como podemos ajudar?")}
            </h2>
          </div>
          {thread && (
            <span
              role="status"
              className={`support-status status-${thread.status.toLowerCase()}`}
            >
              {labels[thread.status]}
            </span>
          )}
        </header>
        {error && (
          <p role="alert" className="service-error">
            {error}
          </p>
        )}
        {admin && thread && (
          <div className="support-admin-status">
            <label htmlFor="support-status">Estado da inquietação</label>
            <select
              id="support-status"
              value={thread.status}
              disabled={busy}
              onChange={(e) => void statusChange(e.target.value)}
            >
              {Object.entries(labels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div
          className="support-message-log"
          role="log"
          aria-label={en ? "Messages" : "Mensagens"}
          aria-live="polite"
        >
          {!selectedId && (
            <div className="support-welcome">
              <MessageCircle aria-hidden="true" className="size-10" />
              <h3>
                {admin
                  ? "Responda aos clientes"
                  : en
                    ? "Talk to our team"
                    : "Fale com a nossa equipa"}
              </h3>
              <p>
                {admin
                  ? "Escolha um pedido de apoio para ler, responder e actualizar o estado."
                  : en
                    ? "An administrator will receive your message and reply here. You can return to track its status."
                    : "Um administrador recebe a sua mensagem e responde aqui. Pode regressar para acompanhar o estado da sua inquietação."}
              </p>
            </div>
          )}
          {thread?.messages.map((message) => (
            <article
              key={message.id}
              className={`support-message ${message.userId === userId ? "message-own" : "message-received"}`}
            >
              <strong>
                {message.isAdmin
                  ? en
                    ? "Agroconet team"
                    : "Equipa Agroconet"
                  : message.user.name}
              </strong>
              <p>{message.body}</p>
              <time dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString(
                  en ? "en-GB" : "pt-MZ",
                )}
              </time>
            </article>
          ))}
          <div ref={bottom} />
        </div>
        {(!admin || selectedId) && (
          <form className="support-composer" onSubmit={send}>
            {!selectedId && (
              <label>
                {en ? "Subject" : "Assunto"}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  minLength={3}
                  maxLength={160}
                  required
                  placeholder={
                    en ? "What would you like to know?" : "Qual é a sua dúvida?"
                  }
                />
              </label>
            )}
            {thread?.status === "RESOLVED" && !admin && (
              <p className="service-muted">
                {en
                  ? "A new message will reopen this conversation."
                  : "Uma nova mensagem reabre esta conversa."}
              </p>
            )}
            <label htmlFor="support-body">
              {en ? "Your message" : "A sua mensagem"}
            </label>
            <textarea
              id="support-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              required
              rows={3}
              placeholder={
                en ? "Write your message…" : "Escreva a sua mensagem…"
              }
              disabled={busy || (!!selectedId && !thread)}
            />
            <div className="support-composer-footer">
              <small>{body.length}/4000</small>
              <button
                className="service-button"
                type="submit"
                disabled={busy || !body.trim() || (!!selectedId && !thread)}
              >
                <Send aria-hidden="true" className="size-4" />
                {busy
                  ? en
                    ? "Sending…"
                    : "A enviar…"
                  : en
                    ? "Send message"
                    : "Enviar mensagem"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
