"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Principal } from "@dfinity/principal";
import {
  Mail,
  Menu,
  LogOut,
  Inbox as InboxIcon,
  Send,
  Pencil,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Star,
  MessageSquare,
  Clock,
  Bell,
  BellOff,
  Plus,
  X,
} from "lucide-react";

import {
  loginAndGetUser,
  clearAuthStorage,
  getMyInbox,
  getMySentMail,
  sendEmail,
  markAsRead,
  toggleStar,
  getStarredEmails,
  getMyStarredKeys,
  sendChatMessage,
  getChatMessages,
  markChatRead,
  getChatList,
  setReminder,
  getDueReminders,
  dismissReminder,
  cancelReminder,
  getMyReminders,
  type Email,
  type ChatMessage,
  type ChatPreview,
  type Reminder,
} from "@/lib/internet-identity";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast, Toaster } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────

type LoginContext = {
  principal: string;
  role: string;
  isNewUser: boolean;
};

type MailFolder = "inbox" | "sent" | "starred";
type AppSection = "mail" | "chat";
type AppState = "loading" | "error" | "authenticated";

type BackendActor = Awaited<ReturnType<typeof loginAndGetUser>>["actor"];

// ─── Helpers ─────────────────────────────────────────────────────────────

function truncatePrincipal(p: string, chars = 5): string {
  if (p.length <= chars * 2 + 3) return p;
  return `${p.slice(0, chars)}...${p.slice(-chars)}`;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  const date = new Date(ms);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function principalToColor(p: string): string {
  let hash = 0;
  for (let i = 0; i < p.length; i++) hash = p.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function principalInitials(p: string): string {
  return p.slice(0, 2).toUpperCase();
}

// ─── Sub-components ──────────────────────────────────────────────────────

function MailHeader({
  principal,
  onLogout,
  onToggleSidebar,
}: {
  principal: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrincipal = useCallback(() => {
    navigator.clipboard.writeText(principal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [principal]);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <Mail className="h-6 w-6" style={{ color: "hsl(348, 100%, 60%)" }} />
        <span className="font-serif text-xl font-semibold">TUAMS</span>
      </Link>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-xs text-white font-medium"
                style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
              >
                {principalInitials(principal)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-xs font-mono">
              {truncatePrincipal(principal, 8)}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Your Principal ID</p>
              <p className="text-xs leading-none text-muted-foreground">
                This is your unique Internet Identity principal
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2">
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
              <code className="flex-1 text-xs font-mono break-all leading-relaxed">
                {principal}
              </code>
              <button
                type="button"
                onClick={handleCopyPrincipal}
                className="shrink-0 p-1.5 rounded hover:bg-accent transition-colors"
                title={copied ? "Copied!" : "Copy Principal ID"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function MailSidebar({
  activeFolder,
  activeSection,
  onFolderChange,
  onSectionChange,
  unreadCount,
  chatUnreadCount,
  onCompose,
  collapsed,
  onClose,
}: {
  activeFolder: MailFolder;
  activeSection: AppSection;
  onFolderChange: (f: MailFolder) => void;
  onSectionChange: (s: AppSection) => void;
  unreadCount: number;
  chatUnreadCount: number;
  onCompose: () => void;
  collapsed: boolean;
  onClose: () => void;
}) {
  const accentStyle = { backgroundColor: "hsl(348, 100%, 60%)" };
  const activeStyle = { backgroundColor: "hsl(348, 100%, 60%, 0.1)", color: "hsl(348, 100%, 60%)" };

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "w-64 border-r border-border bg-card flex flex-col py-4 shrink-0 transition-transform duration-200 z-40",
          "fixed md:relative h-[calc(100%-3.5rem)] md:h-auto",
          collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="px-4 mb-4">
          <button
            type="button"
            onClick={onCompose}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-white text-sm font-medium shadow-md hover:shadow-lg transition-all hover:brightness-110"
            style={accentStyle}
          >
            <Pencil className="h-4 w-4" />
            Send email
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {/* Mail section */}
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mail</p>
          <button
            type="button"
            onClick={() => { onSectionChange("mail"); onFolderChange("inbox"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={activeSection === "mail" && activeFolder === "inbox" ? activeStyle : undefined}
          >
            <InboxIcon className="h-4 w-4" />
            <span className="flex-1 text-left">Inbox</span>
            {unreadCount > 0 && (
              <Badge className="border-0 text-xs px-2 text-white" style={accentStyle}>
                {unreadCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => { onSectionChange("mail"); onFolderChange("sent"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={activeSection === "mail" && activeFolder === "sent" ? activeStyle : undefined}
          >
            <Send className="h-4 w-4" />
            <span className="flex-1 text-left">Sent</span>
          </button>

          <button
            type="button"
            onClick={() => { onSectionChange("mail"); onFolderChange("starred"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={activeSection === "mail" && activeFolder === "starred" ? activeStyle : undefined}
          >
            <Star className="h-4 w-4" />
            <span className="flex-1 text-left">Starred</span>
          </button>

          <Separator className="my-3" />

          {/* Chat section */}
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Chat</p>
          <button
            type="button"
            onClick={() => onSectionChange("chat")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={activeSection === "chat" ? activeStyle : undefined}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="flex-1 text-left">Messages</span>
            {chatUnreadCount > 0 && (
              <Badge className="border-0 text-xs px-2 text-white" style={accentStyle}>
                {chatUnreadCount}
              </Badge>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
}

function EmailList({
  emails,
  folder,
  onSelect,
  loading,
  currentPrincipal,
  starredKeys,
  onToggleStar,
}: {
  emails: Email[];
  folder: MailFolder;
  onSelect: (e: Email) => void;
  loading: boolean;
  currentPrincipal: string;
  starredKeys: Set<string>;
  onToggleStar: (e: Email) => void;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
        {folder === "starred" ? (
          <Star className="h-16 w-16 mb-4 opacity-20" />
        ) : (
          <InboxIcon className="h-16 w-16 mb-4 opacity-20" />
        )}
        <p className="text-lg font-medium">
          {folder === "inbox"
            ? "Your inbox is empty"
            : folder === "sent"
              ? "No sent emails"
              : "No starred emails"}
        </p>
        <p className="text-sm mt-1 opacity-70">
          {folder === "inbox"
            ? "Emails you receive will appear here"
            : folder === "sent"
              ? "Emails you send will appear here"
              : "Star important emails to find them here"}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {emails.map((email, i) => {
          const displayPrincipal =
            folder === "sent" ? email.receiver.toText() : email.sender.toText();
          const isUnread = !email.read && folder === "inbox";
          const starKey = `${email.sender.toText()}-${email.timestamp}`;
          const isStarred = starredKeys.has(starKey);

          return (
            <button
              type="button"
              key={`${email.timestamp}-${i}`}
              onClick={() => onSelect(email)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                isUnread && "bg-[hsl(348,100%,60%,0.04)]"
              )}
            >
              {/* Unread dot */}
              <div className="w-2 shrink-0 flex justify-center">
                {isUnread && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
                  />
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback
                  className="text-white text-xs font-medium"
                  style={{ backgroundColor: principalToColor(displayPrincipal) }}
                >
                  {principalInitials(displayPrincipal)}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      isUnread ? "font-semibold text-foreground" : "font-normal text-foreground"
                    )}
                  >
                    {displayPrincipal === currentPrincipal
                      ? "Me"
                      : truncatePrincipal(displayPrincipal, 8)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span
                    className={cn(
                      "text-sm truncate shrink-0",
                      isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {email.subject || "(no subject)"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    — {email.body.slice(0, 80)}
                  </span>
                </div>
              </div>

              {/* Star */}
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); onToggleStar(email); }}
                className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
              >
                <Star
                  className={cn("h-4 w-4", isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                />
              </button>

              {/* Timestamp */}
              <span
                className={cn(
                  "text-xs shrink-0",
                  isUnread ? "font-semibold" : "text-muted-foreground"
                )}
                style={isUnread ? { color: "hsl(348, 100%, 60%)" } : undefined}
              >
                {formatTimestamp(email.timestamp)}
              </span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function EmailDetail({
  email,
  folder,
  onBack,
  currentPrincipal,
  isStarred,
  onToggleStar,
  onStartChat,
  onSetReminder,
  hasReminder,
}: {
  email: Email;
  folder: MailFolder;
  onBack: () => void;
  currentPrincipal: string;
  isStarred: boolean;
  onToggleStar: () => void;
  onStartChat: (principal: string) => void;
  onSetReminder: () => void;
  hasReminder: boolean;
}) {
  const senderText = email.sender.toText();
  const receiverText = email.receiver.toText();
  const isFromMe = senderText === currentPrincipal;
  const otherPrincipal = isFromMe ? receiverText : senderText;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-sm text-muted-foreground capitalize">{folder}</span>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggleStar}>
              <Star className={cn("h-4 w-4", isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isStarred ? "Unstar" : "Star"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onStartChat(otherPrincipal)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chat with {isFromMe ? "recipient" : "sender"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onSetReminder}>
              {hasReminder ? (
                <BellOff className="h-4 w-4 text-orange-500" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{hasReminder ? "Cancel reminder" : "Remind me"}</TooltipContent>
        </Tooltip>
      </div>

      {/* Email content */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold mb-6">{email.subject || "(no subject)"}</h1>

          <div className="flex items-start gap-3 mb-6">
            <Avatar className="h-10 w-10 mt-0.5">
              <AvatarFallback
                className="text-white text-sm font-medium"
                style={{ backgroundColor: principalToColor(senderText) }}
              >
                {principalInitials(senderText)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {isFromMe ? "Me" : truncatePrincipal(senderText, 10)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(email.timestamp)}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground cursor-help">
                    to{" "}
                    {receiverText === currentPrincipal
                      ? "me"
                      : truncatePrincipal(receiverText, 10)}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs break-all text-xs font-mono">
                  {receiverText}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="text-sm leading-relaxed whitespace-pre-wrap">{email.body}</div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
  onSend,
  sending,
  sendError,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSend: (to: string, subject: string, body: string) => void;
  sending: boolean;
  sendError: string;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) {
      setTo("");
      setSubject("");
      setBody("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogHeader
          className="px-4 py-3 rounded-t-lg"
          style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
        >
          <DialogTitle className="text-sm font-medium text-white">New Message</DialogTitle>
          <DialogDescription className="sr-only">
            Compose and send a new email
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="flex items-center border-b border-border px-4 py-2">
            <span className="text-sm text-muted-foreground w-16 shrink-0">To</span>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient Principal ID"
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-auto py-0"
            />
          </div>

          <div className="flex items-center border-b border-border px-4 py-2">
            <span className="text-sm text-muted-foreground w-16 shrink-0">Subject</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-auto py-0"
            />
          </div>

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="border-0 shadow-none focus-visible:ring-0 min-h-[200px] resize-none rounded-none text-sm px-4 py-3"
          />

          {sendError && <p className="text-xs text-destructive px-4 pb-2">{sendError}</p>}
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => onSend(to, subject, body)}
            disabled={!to.trim() || !subject.trim() || sending}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
          >
            {sending ? "Sending..." : "Send"}
            {!sending && <Send className="h-4 w-4" />}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Chat Components ─────────────────────────────────────────────────────

function ChatListView({
  chatPreviews,
  loading,
  currentPrincipal,
  onSelectChat,
  onNewChat,
}: {
  chatPreviews: ChatPreview[];
  loading: boolean;
  currentPrincipal: string;
  onSelectChat: (otherUser: Principal) => void;
  onNewChat: () => void;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <div className="p-3 border-b border-border">
        <Button variant="outline" className="w-full gap-2" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {chatPreviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground py-20">
          <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No conversations</p>
          <p className="text-sm mt-1 opacity-70">Start a new chat to begin messaging</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {chatPreviews.map((preview) => {
              const otherText = preview.other_user.toText();
              const hasUnread = Number(preview.unread_count) > 0;

              return (
                <button
                  type="button"
                  key={otherText}
                  onClick={() => onSelectChat(preview.other_user)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    hasUnread && "bg-[hsl(348,100%,60%,0.04)]"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      className="text-white text-xs font-medium"
                      style={{ backgroundColor: principalToColor(otherText) }}
                    >
                      {principalInitials(otherText)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm truncate", hasUnread ? "font-semibold" : "font-normal")}>
                        {otherText === currentPrincipal ? "Me" : truncatePrincipal(otherText, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {formatTimestamp(preview.last_timestamp)}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate mt-0.5", hasUnread ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {preview.last_message}
                    </p>
                  </div>

                  {hasUnread && (
                    <Badge className="border-0 text-xs px-2 text-white shrink-0" style={{ backgroundColor: "hsl(348, 100%, 60%)" }}>
                      {Number(preview.unread_count)}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function ChatDetailView({
  messages,
  otherUser,
  currentPrincipal,
  onBack,
  onSendMessage,
  sending,
}: {
  messages: ChatMessage[];
  otherUser: string;
  currentPrincipal: string;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback
            className="text-white text-xs font-medium"
            style={{ backgroundColor: principalToColor(otherUser) }}
          >
            {principalInitials(otherUser)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{truncatePrincipal(otherUser, 10)}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender.toText() === currentPrincipal;
          return (
            <div key={`${msg.timestamp}-${i}`} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  isMe
                    ? "text-white rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
                style={isMe ? { backgroundColor: "hsl(348, 100%, 60%)" } : undefined}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={cn("text-[10px] mt-1", isMe ? "text-white/70" : "text-muted-foreground")}>
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="text-white shrink-0"
            style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewChatDialog({
  open,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: (principalId: string) => void;
}) {
  const [principalId, setPrincipalId] = useState("");

  useEffect(() => {
    if (!open) setPrincipalId("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>Enter the Principal ID of the user you want to chat with.</DialogDescription>
        </DialogHeader>
        <Input
          value={principalId}
          onChange={(e) => setPrincipalId(e.target.value)}
          placeholder="Principal ID"
          className="font-mono text-sm"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!principalId.trim()}
            onClick={() => onStart(principalId.trim())}
            className="text-white"
            style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
          >
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reminder Dialog ─────────────────────────────────────────────────────

function ReminderDialog({
  open,
  onOpenChange,
  onSet,
  setting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSet: (dateTime: Date) => void;
  setting: boolean;
}) {
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    if (!open) setDateTime("");
  }, [open]);

  // Set min to current datetime
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Reminder
          </DialogTitle>
          <DialogDescription>Choose when you want to be reminded about this email.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Remind me at</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              min={minDateTime}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          {/* Quick options */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "In 30 min", minutes: 30 },
              { label: "In 1 hour", minutes: 60 },
              { label: "In 3 hours", minutes: 180 },
              { label: "Tomorrow 9 AM", minutes: -1 },
            ].map(({ label, minutes }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => {
                  let target: Date;
                  if (minutes === -1) {
                    target = new Date();
                    target.setDate(target.getDate() + 1);
                    target.setHours(9, 0, 0, 0);
                  } else {
                    target = new Date(Date.now() + minutes * 60_000);
                  }
                  const local = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                  setDateTime(local);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!dateTime || setting}
            onClick={() => {
              if (dateTime) onSet(new Date(dateTime));
            }}
            className="text-white"
            style={{ backgroundColor: "hsl(348, 100%, 60%)" }}
          >
            {setting ? "Setting..." : "Set Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────

function TuamailPageContent() {
  // Auth state
  const [appState, setAppState] = useState<AppState>("loading");
  const [context, setContext] = useState<LoginContext | null>(null);
  const [error, setError] = useState("");
  const actorRef = useRef<BackendActor | null>(null);

  // Mail data
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [starredEmails, setStarredEmails] = useState<Email[]>([]);
  const [starredKeys, setStarredKeys] = useState<Set<string>>(new Set());
  const [mailLoading, setMailLoading] = useState(true);

  // Chat data
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<Principal | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  // Reminder data
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);

  // UI state
  const [activeSection, setActiveSection] = useState<AppSection>("mail");
  const [activeFolder, setActiveFolder] = useState<MailFolder>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Compose state
  const [sending, setSending] = useState(false);
  const [composeSendError, setComposeSendError] = useState("");

  const unreadCount = useMemo(
    () => inboxEmails.filter((e) => !e.read).length,
    [inboxEmails]
  );

  const chatUnreadCount = useMemo(
    () => chatPreviews.reduce((acc, p) => acc + Number(p.unread_count), 0),
    [chatPreviews]
  );

  // ── Data loading ──

  const loadEmails = useCallback(async (actor: BackendActor) => {
    setMailLoading(true);
    try {
      const [inbox, sent, starred, keys] = await Promise.all([
        getMyInbox(actor),
        getMySentMail(actor),
        getStarredEmails(actor),
        getMyStarredKeys(actor),
      ]);
      setInboxEmails(inbox.sort((a, b) => Number(b.timestamp - a.timestamp)));
      setSentEmails(sent.sort((a, b) => Number(b.timestamp - a.timestamp)));
      setStarredEmails(starred.sort((a, b) => Number(b.timestamp - a.timestamp)));
      setStarredKeys(new Set(keys.map(([p, t]) => `${p.toText()}-${t}`)));
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setMailLoading(false);
    }
  }, []);

  const loadChatList = useCallback(async (actor: BackendActor) => {
    try {
      const list = await getChatList(actor);
      setChatPreviews(list);
    } catch (err) {
      console.error("Failed to load chat list:", err);
    }
  }, []);

  const loadChatMessages = useCallback(async (actor: BackendActor, otherUser: Principal) => {
    try {
      const msgs = await getChatMessages(actor, otherUser);
      setChatMessages(msgs);
      await markChatRead(actor, otherUser);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    }
  }, []);

  const loadReminders = useCallback(async (actor: BackendActor) => {
    try {
      const rems = await getMyReminders(actor);
      setReminders(rems);
    } catch (err) {
      console.error("Failed to load reminders:", err);
    }
  }, []);

  const checkDueReminders = useCallback(async (actor: BackendActor) => {
    try {
      const due = await getDueReminders(actor);
      for (const rem of due) {
        // Find the email for context
        const allEmails = [...inboxEmails, ...sentEmails];
        const email = allEmails.find(
          (e) => e.sender.toText() === rem.email_sender.toText() && e.timestamp === rem.email_timestamp
        );
        const subject = email?.subject || "an email";
        toast.info(`Reminder: "${subject}"`, {
          description: `From ${truncatePrincipal(rem.email_sender.toText(), 8)}`,
          action: {
            label: "Dismiss",
            onClick: async () => {
              await dismissReminder(actor, rem.email_sender, rem.email_timestamp);
              loadReminders(actor);
            },
          },
          duration: 15000,
        });
        // Auto-dismiss after showing
        await dismissReminder(actor, rem.email_sender, rem.email_timestamp);
      }
      if (due.length > 0) {
        loadReminders(actor);
      }
    } catch (err) {
      console.error("Failed to check due reminders:", err);
    }
  }, [inboxEmails, sentEmails, loadReminders]);

  // ── Auth + initial load ──

  useEffect(() => {
    loginAndGetUser()
      .then(async ({ principal, user, isNewUser, actor }) => {
        actorRef.current = actor;
        const ctx: LoginContext = { principal, role: user.role, isNewUser };
        window.localStorage.setItem("tuamail_login_context", JSON.stringify(ctx));
        setContext(ctx);
        setAppState("authenticated");
        await Promise.all([loadEmails(actor), loadChatList(actor), loadReminders(actor)]);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Authentication failed.";
        setError(msg);
        setAppState("error");
      });
  }, [loadEmails, loadChatList, loadReminders]);

  // ── Polling for chat and reminders ──

  useEffect(() => {
    if (appState !== "authenticated" || !actorRef.current) return;

    // Poll chat list every 10 seconds
    const chatInterval = setInterval(() => {
      if (actorRef.current) loadChatList(actorRef.current);
    }, 10_000);

    // Poll active chat every 5 seconds
    const msgInterval = setInterval(() => {
      if (actorRef.current && activeChatUser) {
        loadChatMessages(actorRef.current, activeChatUser);
      }
    }, 5_000);

    // Poll due reminders every 30 seconds
    const reminderInterval = setInterval(() => {
      if (actorRef.current) checkDueReminders(actorRef.current);
    }, 30_000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(msgInterval);
      clearInterval(reminderInterval);
    };
  }, [appState, activeChatUser, loadChatList, loadChatMessages, checkDueReminders]);

  // ── Actions ──

  const handleMarkAsRead = useCallback(async (email: Email) => {
    if (email.read || !actorRef.current) return;
    try {
      await markAsRead(actorRef.current, email.sender, email.timestamp);
      setInboxEmails((prev) =>
        prev.map((e) =>
          e.sender.toText() === email.sender.toText() && e.timestamp === email.timestamp
            ? { ...e, read: true }
            : e
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  const handleToggleStar = useCallback(async (email: Email) => {
    if (!actorRef.current) return;
    const key = `${email.sender.toText()}-${email.timestamp}`;
    const isCurrentlyStarred = starredKeys.has(key);
    const newStarred = !isCurrentlyStarred;

    // Optimistic update
    setStarredKeys((prev) => {
      const next = new Set(prev);
      if (newStarred) next.add(key);
      else next.delete(key);
      return next;
    });

    try {
      await toggleStar(actorRef.current, email.sender, email.timestamp, newStarred);
      // Reload starred emails
      if (actorRef.current) {
        const starred = await getStarredEmails(actorRef.current);
        setStarredEmails(starred.sort((a, b) => Number(b.timestamp - a.timestamp)));
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
      // Revert on error
      setStarredKeys((prev) => {
        const next = new Set(prev);
        if (isCurrentlyStarred) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  }, [starredKeys]);

  const handleSendEmail = useCallback(
    async (to: string, subject: string, body: string) => {
      if (!actorRef.current) return;
      setComposeSendError("");
      setSending(true);
      try {
        const receiverPrincipal = Principal.fromText(to.trim());
        await sendEmail(actorRef.current, receiverPrincipal, subject, body);
        const sent = await getMySentMail(actorRef.current);
        setSentEmails(sent.sort((a, b) => Number(b.timestamp - a.timestamp)));
        setComposeOpen(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to send email.";
        setComposeSendError(msg.includes("Invalid principal") ? "Invalid Principal ID." : msg);
      } finally {
        setSending(false);
      }
    },
    []
  );

  const handleSendChatMessage = useCallback(async (content: string) => {
    if (!actorRef.current || !activeChatUser) return;
    setChatSending(true);
    try {
      await sendChatMessage(actorRef.current, activeChatUser, content);
      await loadChatMessages(actorRef.current, activeChatUser);
      loadChatList(actorRef.current);
    } catch (err) {
      console.error("Failed to send chat message:", err);
      toast.error("Failed to send message");
    } finally {
      setChatSending(false);
    }
  }, [activeChatUser, loadChatMessages, loadChatList]);

  const handleStartChat = useCallback((principalId: string) => {
    try {
      const principal = Principal.fromText(principalId.trim());
      setActiveChatUser(principal);
      setActiveSection("chat");
      setNewChatOpen(false);
      setSidebarCollapsed(true);
      if (actorRef.current) {
        loadChatMessages(actorRef.current, principal);
      }
    } catch {
      toast.error("Invalid Principal ID");
    }
  }, [loadChatMessages]);

  const handleSetReminder = useCallback(async (dateTime: Date) => {
    if (!actorRef.current || !selectedEmail) return;
    setSettingReminder(true);
    try {
      const remindAtNs = BigInt(dateTime.getTime()) * BigInt(1_000_000);
      await setReminder(actorRef.current, selectedEmail.sender, selectedEmail.timestamp, remindAtNs);
      toast.success("Reminder set!", {
        description: `You'll be reminded on ${dateTime.toLocaleString()}`,
      });
      setReminderDialogOpen(false);
      loadReminders(actorRef.current);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to set reminder.";
      toast.error(msg);
    } finally {
      setSettingReminder(false);
    }
  }, [selectedEmail, loadReminders]);

  const handleCancelReminder = useCallback(async (email: Email) => {
    if (!actorRef.current) return;
    try {
      await cancelReminder(actorRef.current, email.sender, email.timestamp);
      toast.success("Reminder cancelled");
      loadReminders(actorRef.current);
    } catch (err) {
      console.error("Failed to cancel reminder:", err);
    }
  }, [loadReminders]);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("tuamail_login_context");
    window.location.href = "/";
  }, []);

  const handleRefresh = useCallback(() => {
    if (actorRef.current) {
      loadEmails(actorRef.current);
      loadChatList(actorRef.current);
    }
  }, [loadEmails, loadChatList]);

  const emailHasReminder = useCallback((email: Email): boolean => {
    return reminders.some(
      (r) => r.email_sender.toText() === email.sender.toText() && r.email_timestamp === email.timestamp && !r.fired
    );
  }, [reminders]);

  // ── Loading state ──

  if (appState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Mail className="h-12 w-12 animate-pulse" style={{ color: "hsl(348, 100%, 60%)" }} />
          <p className="text-muted-foreground text-sm">Connecting to Internet Identity...</p>
        </div>
      </main>
    );
  }

  // ── Error state ──

  if (appState === "error") {
    const isStorageError = error.includes("corrupted") || error.includes("anchor_number");

    return (
      <main className="min-h-screen px-6 py-20 bg-background text-foreground">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-8 md:p-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Tuamail</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">Login Failed</h1>
          <p className="text-red-500 mb-6">{error}</p>

          {isStorageError && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                <strong>Tip:</strong> This error usually happens when your browser&apos;s
                authentication data is corrupted. Click the button below to clear it and try again.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/"
              className="inline-flex px-5 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Back to homepage
            </Link>
            {isStorageError && (
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setAppState("loading");
                  try {
                    await clearAuthStorage();
                    window.location.reload();
                  } catch {
                    setError("Failed to clear storage. Please manually clear your browser data.");
                    setAppState("error");
                  }
                }}
                className="inline-flex px-5 py-3 rounded-full border border-amber-500 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
              >
                Clear Storage &amp; Retry
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Authenticated ──

  const currentEmails =
    activeFolder === "inbox"
      ? inboxEmails
      : activeFolder === "sent"
        ? sentEmails
        : starredEmails;

  return (
    <TooltipProvider>
      <main className="h-screen flex flex-col bg-background overflow-hidden">
        <Toaster position="top-right" richColors />
        <MailHeader
          principal={context!.principal}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <MailSidebar
            activeFolder={activeFolder}
            activeSection={activeSection}
            onFolderChange={(f) => {
              setActiveFolder(f);
              setSelectedEmail(null);
              setSidebarCollapsed(true);
            }}
            onSectionChange={(s) => {
              setActiveSection(s);
              setSelectedEmail(null);
              setActiveChatUser(null);
              setSidebarCollapsed(true);
              if (s === "chat" && actorRef.current) {
                loadChatList(actorRef.current);
              }
            }}
            unreadCount={unreadCount}
            chatUnreadCount={chatUnreadCount}
            onCompose={() => {
              setComposeOpen(true);
              setSidebarCollapsed(true);
            }}
            collapsed={sidebarCollapsed}
            onClose={() => setSidebarCollapsed(true)}
          />

          {/* Main content */}
          <div
              className="
                flex-1 flex flex-col overflow-hidden
                bg-white/10
                backdrop-blur-2xl
                border border-white/15
                shadow-[0_8px_32px_rgba(0,0,0,0.25)]
                rounded-2xl
                m-4
              "
            >
            {activeSection === "mail" ? (
              <>
                {/* Folder header */}
                {!selectedEmail && (
                  <div
                      className="
                        flex items-center justify-between px-4 py-2.5 shrink-0
                        bg-white/5
                        backdrop-blur-xl
                        border-b border-white/10
                      "
                    >
                    <h2 className="text-sm font-medium capitalize">{activeFolder}</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={mailLoading}
                      className="h-8 w-8"
                    >
                      <RefreshCw className={cn("h-4 w-4", mailLoading && "animate-spin")} />
                    </Button>
                  </div>
                )}

                {/* List or Detail */}
                <div className="flex-1 p-4 overflow-hidden">
                <div
                  className="
                    h-full
                    rounded-2xl
                    bg-white/10
                    backdrop-blur-2xl
                    border border-white/15
                    shadow-[0_8px_32px_rgba(0,0,0,0.25)]
                    overflow-hidden
                    flex flex-col
                  "
                >
                {selectedEmail ? (
                  <EmailDetail
                    email={selectedEmail}
                    folder={activeFolder}
                    onBack={() => setSelectedEmail(null)}
                    currentPrincipal={context!.principal}
                    isStarred={starredKeys.has(`${selectedEmail.sender.toText()}-${selectedEmail.timestamp}`)}
                    onToggleStar={() => handleToggleStar(selectedEmail)}
                    onStartChat={handleStartChat}
                    onSetReminder={() => {
                      if (emailHasReminder(selectedEmail)) {
                        handleCancelReminder(selectedEmail);
                      } else {
                        setReminderDialogOpen(true);
                      }
                    }}
                    hasReminder={emailHasReminder(selectedEmail)}
                  />
                ) : (
                  <EmailList
                    emails={currentEmails}
                    folder={activeFolder}
                    onSelect={(email) => {
                      setSelectedEmail(email);
                      if (!email.read && activeFolder === "inbox") {
                        handleMarkAsRead(email);
                      }
                    }}
                    loading={mailLoading}
                    currentPrincipal={context!.principal}
                    starredKeys={starredKeys}
                    onToggleStar={handleToggleStar}
                  />
                )}
                </div>
              </div>
            </>
            ) : (
              // Chat section
              <>
                {activeChatUser ? (
                  <ChatDetailView
                    messages={chatMessages}
                    otherUser={activeChatUser.toText()}
                    currentPrincipal={context!.principal}
                    onBack={() => {
                      setActiveChatUser(null);
                      if (actorRef.current) loadChatList(actorRef.current);
                    }}
                    onSendMessage={handleSendChatMessage}
                    sending={chatSending}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
                      <h2 className="text-sm font-medium">Messages</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (actorRef.current) loadChatList(actorRef.current); }}
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <ChatListView
                      chatPreviews={chatPreviews}
                      loading={chatLoading}
                      currentPrincipal={context!.principal}
                      onSelectChat={(otherUser) => {
                        setActiveChatUser(otherUser);
                        if (actorRef.current) loadChatMessages(actorRef.current, otherUser);
                      }}
                      onNewChat={() => setNewChatOpen(true)}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <ComposeDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          onSend={handleSendEmail}
          sending={sending}
          sendError={composeSendError}
        />

        <NewChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onStart={handleStartChat}
        />

        <ReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          onSet={handleSetReminder}
          setting={settingReminder}
        />
      </main>
    </TooltipProvider>
  );
}

export default function TuamailPage() {
  return <TuamailPageContent />;
}
