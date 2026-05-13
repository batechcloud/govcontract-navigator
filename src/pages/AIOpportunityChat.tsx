import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  User,
  RotateCcw,
  Building2,
  Lightbulb,
  ChevronRight,
  MessageSquare,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, useConversationMessages } from "@/hooks/useConversations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-opportunity-chat`;

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "How do I find government contracts for an IT company?",
  "What is a NAICS code and how do I choose the right one?",
  "Explain what a set-aside contract means for small businesses",
  "What documents do I need to register on SAM.gov?",
  "How do I write a strong executive summary for a proposal?",
  "What's the difference between an RFP, RFQ, and Sources Sought?",
  "How long does the typical government bidding process take?",
  "What certifications give me an advantage as a small business?",
];

export default function AIOpportunityChat() {
  const { user } = useAuth();
  const { data: companyProfile } = useCompanyProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Conversation state
  const { conversations, createConversation, deleteConversation, updateTitle } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { messages: savedMessages, addMessage } = useConversationMessages(activeConversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didAutoSend = useRef(false);
  const didLoadSaved = useRef<string | null>(null);

  // Load saved messages when switching conversations
  useEffect(() => {
    if (activeConversationId && savedMessages.length > 0 && didLoadSaved.current !== activeConversationId) {
      didLoadSaved.current = activeConversationId;
      setMessages(savedMessages.map(m => ({ role: m.role, content: m.content })));
    }
  }, [activeConversationId, savedMessages]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send pre-loaded question from ?q= param
  useEffect(() => {
    const preload = searchParams.get("q");
    if (preload && !didAutoSend.current) {
      didAutoSend.current = true;
      setSearchParams({}, { replace: true });
      setTimeout(() => sendMessage(preload), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const ensureConversation = useCallback(async (firstMessage: string): Promise<string> => {
    if (activeConversationId) return activeConversationId;
    // Create a new conversation with a title from the first message
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "…" : "");
    const conv = await createConversation.mutateAsync(title);
    setActiveConversationId(conv.id);
    didLoadSaved.current = conv.id;
    return conv.id;
  }, [activeConversationId, createConversation]);

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    const userMsg: Message = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    let convId: string;

    try {
      convId = await ensureConversation(userText);

      // Persist user message
      await addMessage.mutateAsync({ conversationId: convId, role: "user", content: userText });

      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = `Bearer ${session?.access_token || ""}`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          messages: newMessages,
          companyContext: companyProfile
            ? {
                company_name: companyProfile.company_name,
                capabilities: companyProfile.capabilities,
                certifications: companyProfile.certifications,
                naics_codes: companyProfile.naics_codes,
                employee_count: companyProfile.employee_count,
                annual_revenue: companyProfile.annual_revenue,
              }
            : null,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Please add funds to continue.");
        } else {
          toast.error(errData.error || "AI service temporarily unavailable.");
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

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
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunk) {
              assistantSoFar += chunk;
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunk) {
              assistantSoFar += chunk;
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                )
              );
            }
          } catch { /* ignore */ }
        }
      }

      // Persist assistant message
      if (assistantSoFar) {
        await addMessage.mutateAsync({ conversationId: convId, role: "assistant", content: assistantSoFar });
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Failed to connect to AI assistant. Please try again.");
      if (!assistantSoFar) {
        setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    didLoadSaved.current = null;
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleSelectConversation = (id: string) => {
    if (id === activeConversationId) return;
    didLoadSaved.current = null;
    setActiveConversationId(id);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation.mutateAsync(id);
    if (activeConversationId === id) {
      handleNewChat();
    }
  };

  return (
    <DashboardLayout title="Ask AI">
      <div className="flex h-[calc(100vh-8rem)] gap-0">
        {/* Conversation History Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <Card variant="glass" className="h-full flex flex-col rounded-r-none border-r-0">
                <div className="p-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">History</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewChat}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-0.5">
                    {conversations.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 text-center py-8 px-2">
                        No conversations yet. Start chatting!
                      </p>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors group",
                            activeConversationId === conv.id
                              ? "bg-primary/20 text-foreground border border-primary/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate flex-1">{conv.title}</span>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full gap-4 min-w-0">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-foreground">GC Navigator Helper</h2>
                <p className="text-xs text-muted-foreground">
                  Powered by AI · Specialized in government contracting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {companyProfile && (
                <Badge variant="glass" className="hidden sm:flex items-center gap-1 text-xs">
                  <Building2 className="w-3 h-3" />
                  {companyProfile.company_name}
                </Badge>
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5" />
                  New chat
                </Button>
              )}
            </div>
          </div>

          {/* Chat area */}
          <Card variant="glass" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-6 pb-2">
                {messages.length === 0 ? (
                  /* Welcome / Suggestions state */
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center pt-6 pb-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4 ring-1 ring-border">
                      <Sparkles className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="font-heading font-semibold text-xl text-foreground mb-2">
                      Ask me anything about government contracting
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mb-8">
                      I can help you understand contracts, find the right opportunities, write proposals, decode requirements, and guide you through the entire bidding process.
                    </p>

                    {companyProfile && (
                      <div className="w-full max-w-sm mb-6 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2 text-left">
                        <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-primary">{companyProfile.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            I have your company profile loaded — I'll give personalized advice based on your capabilities and certifications.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="col-span-full flex items-center gap-2 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Suggested questions</span>
                      </div>
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="group flex items-center gap-2 text-left text-sm px-3 py-2.5 rounded-lg border border-border/60 bg-card/50 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* Message thread */
                  messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                        <AvatarFallback
                          className={
                            msg.role === "assistant"
                              ? "bg-gradient-to-br from-primary to-accent/60 text-primary-foreground"
                              : "bg-secondary text-foreground"
                          }
                        >
                          {msg.role === "assistant" ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border border-border/60 text-foreground rounded-tl-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:font-semibold [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-xs">
                            {msg.content ? (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                              <span className="flex gap-1 items-center text-muted-foreground">
                                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="px-4 pb-4 pt-2 border-t border-border/50">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about contracts, proposals, certifications, SAM.gov…"
                  className="min-h-[48px] max-h-32 resize-none text-sm leading-relaxed"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  variant="hero"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                >
                  {isLoading ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-2 text-center">
                Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Shift+Enter</kbd> for new line
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
