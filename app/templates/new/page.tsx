"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft,
  Save,
  Type,
  QrCode,
  Barcode,
  GripVertical,
  Trash2,
  Plus,
  Settings2,
  ImageIcon,
  Upload,
  Sparkles,
  X,
  Hash,
  Link2,
  Unlink2,
  Minus,
  Square,
  Circle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LabelElement, ElementType } from "@/lib/label-types"
import { resolveDateVars, DATE_SHORTCUTS, isDateToken } from "@/lib/date-vars"

const PRESET_SIZES = [
  { label: "80 × 40 mm (catering / vianda)", width: 80, height: 40 },
  { label: "100 × 50 mm (almacén / logística)", width: 100, height: 50 },
  { label: "100 × 150 mm (envío / caja)", width: 100, height: 150 },
  { label: "50 × 30 mm (precio chico)", width: 50, height: 30 },
  { label: "100 × 100 mm (cuadrada)", width: 100, height: 100 },
  { label: "Personalizado", width: 0, height: 0 },
]