export type WorkerMetadata = {
  profile?: {
    completionPercentage?: number
    visibility?: "public" | "private" | "hidden"
    featured?: boolean
  }

  verification?: {
    status?: "pending" | "verified" | "rejected"
    documentsSubmitted?: boolean
    verifiedAt?: string | null
    notes?: string
  }

  preferences?: {
    notifications?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
    language?: string
  }

  internal?: {
    adminNotes?: string
    riskFlag?: boolean
  }
}
