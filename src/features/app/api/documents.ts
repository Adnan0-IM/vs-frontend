import { apiClient } from "@/lib/api-client"

export type DocumentType = "Certificate" | "Transcript" | "Letter" | "Diploma" | "Other"
export type DocumentStatus = "ACTIVE" | "REVOKED" | "ARCHIVED"

export interface SignedDocument {
  id: string
  organizationId: string
  signedBy: string
  title: string
  originalFilename: string
  fileUrl: string
  mimeType: string
  fileSize: number
  type: DocumentType
  documentHash: string
  digitalSignature: string
  signedPdf?: string | null
  verificationToken: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  signer?: {
    id: string
    name: string
    email: string
  }
}

export type VerificationResult =
  | "VERIFIED"
  | "TAMPERED_HASH"
  | "TAMPERED_SIGNATURE"
  | "NO_MATCHING_RECORD"
  | "STORAGE_ERROR"
  | "NOT_FOUND"
  | "MODIFIED_VERSION";

export interface VerificationLog {
  id: string
  documentId: string
  verificationType: "QR_SCAN" | "FILE_UPLOAD"
  verificationResult: VerificationResult
  verifiedByUserId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  verificationTimestamp: string
  document?: {
    title: string
    originalFilename: string
    type: DocumentType
  }
}

export interface VerificationResponse {
  success: boolean
  verified: boolean
  result: VerificationResult
  documentStatus?: DocumentStatus
  message?: string
  document?: {
    id: string
    title: string
    type: DocumentType
    originalFilename: string
    fileUrl: string
    fileSize: number
    createdAt: string
  }
  organization?: {
    id: string
    name: string
  }
}

export async function fetchDocuments(params?: {
  search?: string
  type?: string
  status?: string
}): Promise<SignedDocument[]> {
  const { data } = await apiClient.get<{ success: boolean; documents: SignedDocument[] }>(
    "/documents/list",
    { params }
  )
  return data.documents
}

export async function uploadAndSignDocument(data: {
  title: string
  type: DocumentType
  fileUrl: string
  originalFilename: string
  fileSize: number
  mimeType: string
}): Promise<SignedDocument> {
  const response = await apiClient.post<{ success: boolean; document: SignedDocument }>(
    "/documents/upload-and-sign",
    data
  )
  return response.data.document
}

export async function revokeDocument(documentId: string): Promise<boolean> {
  const { data } = await apiClient.post<{ success: boolean }>(
    "/documents/revoke",
    { documentId }
  )
  return data.success
}

export async function fetchVerificationLogs(): Promise<VerificationLog[]> {
  const { data } = await apiClient.get<{ success: boolean; logs: VerificationLog[] }>(
    "/documents/verification-logs"
  )
  return data.logs
}

export async function verifyDocumentByToken(token: string): Promise<VerificationResponse> {
  const { data } = await apiClient.get<VerificationResponse>(
    `/documents/verify/${token}`
  )
  return data
}

export async function verifyDocumentByFile(fileUrl: string): Promise<VerificationResponse> {
  const { data } = await apiClient.post<VerificationResponse>(
    "/documents/verify-file",
    { fileUrl }
  )
  return data
}
