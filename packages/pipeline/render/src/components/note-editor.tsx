"use client"

import { useState, useEffect } from "react"
import type { Encounter } from "@storage/types"
import { Button } from "@ui/lib/ui/button"
import { Textarea } from "@ui/lib/ui/textarea"
import { Badge } from "@ui/lib/ui/badge"
import { ScrollArea } from "@ui/lib/ui/scroll-area"
import { Save, Copy, Download, Check, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@ui/lib/utils"

const VISIT_TYPE_LABELS: Record<string, string> = {
  history_physical: "History & Physical",
  problem_visit: "Problem Visit",
  consult_note: "Consult Note",
}

interface NoteEditorProps {
  encounter: Encounter
  onSave: (noteText: string) => void
}

type TabType = "note" | "transcript"

export function NoteEditor({ encounter, onSave }: NoteEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("note")
  const [noteMarkdown, setNoteMarkdown] = useState<string>(encounter.note_text || "")
  const [hasChanges, setHasChanges] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setNoteMarkdown(encounter.note_text || "")
    setHasChanges(false)
  }, [encounter.id, encounter.note_text])

  const handleNoteChange = (value: string) => {
    setNoteMarkdown(value)
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = () => {
    onSave(noteMarkdown)
    setHasChanges(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = async () => {
    const textToCopy = activeTab === "note" ? noteMarkdown : encounter.transcript_text
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const isNote = activeTab === "note"
    const content = isNote ? noteMarkdown : encounter.transcript_text
    const blob = new Blob([content], { type: isNote ? "text/markdown" : "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const suffix = isNote ? "note" : "transcript"
    const extension = isNote ? "md" : "txt"
    a.download = `${encounter.patient_name || "encounter"}_${suffix}_${format(new Date(encounter.created_at), "yyyy-MM-dd")}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-background px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-foreground">{encounter.patient_name || "Unknown Patient"}</h2>
              {encounter.patient_id && (
                <Badge
                  variant="secondary"
                  className="rounded-full font-mono text-xs bg-secondary text-muted-foreground"
                >
                  {encounter.patient_id}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{format(new Date(encounter.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
              {encounter.visit_reason && (
                <>
                  <span className="text-border">·</span>
                  <span>{VISIT_TYPE_LABELS[encounter.visit_reason] || encounter.visit_reason}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs with action buttons */}
        <div className="mt-4 flex items-center justify-between gap-4 border-b border-border">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("note")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                "border-b-2 -mb-px",
                activeTab === "note"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Clinical Note
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                "border-b-2 -mb-px",
                activeTab === "transcript"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Transcript
            </button>
          </div>
          
          <div className="flex items-center gap-1 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
              <span className="text-xs">Copy</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Export</span>
            </Button>
            {activeTab === "note" && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  "ml-1 h-8 rounded-full px-3 bg-foreground text-background hover:bg-foreground/90",
                  saved && "bg-success hover:bg-success",
                )}
              >
                {saved ? <Check className="h-4 w-4 mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                <span className="text-xs">{saved ? "Saved" : "Save"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8">
          {activeTab === "note" ? (
            <Textarea
              value={noteMarkdown}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Clinical note markdown..."
              className="min-h-[600px] resize-none rounded-xl border-border bg-secondary font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <div className="min-h-[600px] rounded-xl border border-border bg-secondary p-6">
              {encounter.transcript_text ? (
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                  {encounter.transcript_text}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">No transcript available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
