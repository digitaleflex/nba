"use client"

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰",
  "😘", "😋", "😜", "🤪", "🤔", "🤨", "😐", "😏", "😒", "🙄",
  "😴", "😎", "🥳", "😢", "😭", "😤", "😠", "😡", "🤯", "😱",
  "😳", "🥺", "😬", "😅", "😆", "😹", "🙃", "😌", "😔", "😪",
  "🤗", "🤭", "🫢", "🤫", "😈", "👍", "👎", "👏", "🙌", "🙏",
  "💪", "🤝", "✌️", "🤞", "👌", "👋", "🤙", "💯", "🔥", "✨",
  "⭐", "🌟", "💡", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤",
  "💔", "💕", "💖", "💗", "💓", "💞", "💘", "😍", "🥰", "💋",
  "🎉", "🎊", "🎁", "🏆", "🥇", "⚽", "🏀", "🎯", "🚀", "💼",
  "📈", "📉", "💰", "💵", "📞", "📧", "✅", "❌", "⚠️", "❓",
  "❗", "💬", "📝", "📌", "👀", "🐱", "🐶", "🌹", "🌈", "☀️",
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div className="absolute bottom-12 left-0 z-20 w-64 rounded-xl border border-border bg-popover p-2 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Emojis</span>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJIS.map((e, i) => (
          <button
            key={`${e}-${i}`}
            onClick={() => onSelect(e)}
            className="flex size-7 items-center justify-center rounded text-lg hover:bg-muted"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
