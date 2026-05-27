export type HouseholdRole = 'owner' | 'member'
export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense'
export type BankConnectionStatus = 'pending' | 'active' | 'expired' | 'revoked'
export type TransactionSource = 'manual' | 'bank'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Household {
  id: string
  name: string
  created_at: string
  owner_id: string
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: HouseholdRole
  joined_at: string
  profile?: Profile
}

export interface Category {
  id: string
  household_id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  is_default: boolean
}

export interface Transaction {
  id: string
  household_id: string
  user_id: string
  category_id: string | null
  amount: number
  type: TransactionType
  description: string | null
  date: string
  created_at: string
  source: TransactionSource
  external_tx_id: string | null
  category?: Category
  profile?: Profile
}

export interface Budget {
  id: string
  household_id: string
  category_id: string
  amount: number
  month: string
  category?: Category
  spent?: number
}

export interface Invitation {
  id: string
  household_id: string
  email: string
  token: string
  created_by: string
  expires_at: string
  accepted_at: string | null
}

export interface BankConnection {
  id: string
  household_id: string
  user_id: string
  provider: string
  institution_id: string
  institution_name: string
  requisition_id: string
  status: BankConnectionStatus
  last_sync_at: string | null
  created_at: string
}

export interface BankAccount {
  id: string
  bank_connection_id: string
  household_id: string
  external_account_id: string
  iban: string | null
  name: string
  currency: string
  is_active: boolean
}

export interface TransactionFilters {
  month?: string
  categoryId?: string
  type?: TransactionType
  userId?: string
  search?: string
  page?: number
}

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  byCategory: Array<{ category_id: string; total: number }>
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
}
