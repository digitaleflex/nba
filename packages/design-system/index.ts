// @nba/design-system — Public API

// UI Primitives (Shadcn/Base UI wrappers)
export { Button } from "./components/ui/button"
export { Input } from "./components/ui/input"
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, CardAction } from "./components/ui/card"
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog"
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
export { Checkbox } from "./components/ui/checkbox"
export { Switch } from "./components/ui/switch"
export { Badge } from "./components/ui/badge"
export { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs"
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./components/ui/dropdown-menu"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip"
export { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover"
export { Skeleton } from "./components/ui/skeleton"
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/ui/table"
export { BottomSheet, BottomSheetTrigger, BottomSheetClose, BottomSheetOverlay, BottomSheetContent, BottomSheetHeader } from "./components/bottom-sheet"
export { SwipeableRow } from "./components/swipeable-row"
export { Chart } from "./components/chart"
export type { ChartDatum, ChartColor } from "./components/chart"
export { EmptyState } from "./components/empty-state"
export type { EmptyStateAction } from "./components/empty-state"
export { TopLoader } from "./components/top-loader"

// Hooks
export { useMediaQuery } from "./hooks/use-media-query"
export { useIsMobile, useIsTouchDevice } from "./hooks/use-is-mobile"

// Responsive utilities
export { Responsive } from "./components/responsive"

// Providers
export { ThemeProvider } from "./providers/theme-provider"
export { ToastProvider } from "./providers/toast-provider"

// Utils
export { cn } from "./lib/utils"

// Animations (variantes respectant prefers-reduced-motion)
export {
  useMotionVariant,
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  reducedVariants,
} from "./animations"
