/**
 * Renderiza iconos de Lucide dinámicamente
 * Soporta nombres de Lucide (PascalCase) y emojis legacy
 */

import {
  Banknote,
  Smartphone,
  CreditCard,
  QrCode,
  ArrowLeftRight,
  Package,
  Store,
  ShoppingCart,
  DollarSign,
  ArrowDownCircle,
  Truck,
  Receipt,
  UserMinus,
  Briefcase,
  ArrowUpCircle,
  RefreshCw,
  Wallet,
  List,
  Wallet2,
  Building2,
  HandCoins,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Coins,
  BadgeDollarSign
} from 'lucide-react'

// Mapa de iconos por nombre Lucide
const iconMap = {
  Banknote,
  Smartphone,
  CreditCard,
  QrCode,
  ArrowLeftRight,
  Package,
  Store,
  ShoppingCart,
  DollarSign,
  ArrowDownCircle,
  Truck,
  Receipt,
  UserMinus,
  Briefcase,
  ArrowUpCircle,
  RefreshCw,
  Wallet,
  List,
  Wallet2,
  Building2,
  HandCoins,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Coins,
  BadgeDollarSign
}

// Mapa de emojis a iconos Lucide (para datos legacy)
const emojiMap = {
  '🏪': Store,
  '🛒': ShoppingCart,
  '💵': DollarSign,
  '💰': DollarSign,
  '⬇️': ArrowDownCircle,
  '📦': Package,
  '🚚': Truck,
  '🧾': Receipt,
  '👤': UserMinus,
  '💼': Briefcase,
  '⬆️': ArrowUpCircle,
  '🔄': RefreshCw,
  '💳': CreditCard,
  '📱': Smartphone,
  '📲': QrCode,
  '↔️': ArrowLeftRight,
  '👛': Wallet,
  '📋': List
}

export default function IconoDinamico({ nombre, className = "w-5 h-5" }) {
  if (!nombre) {
    return <List className={className} />
  }

  // Primero buscar en el mapa de nombres Lucide
  let IconComponent = iconMap[nombre]

  // Si no encuentra, buscar en el mapa de emojis
  if (!IconComponent) {
    IconComponent = emojiMap[nombre]
  }

  // Si sigue sin encontrar, usar List como fallback
  if (!IconComponent) {
    IconComponent = List
  }

  return <IconComponent className={className} />
}
