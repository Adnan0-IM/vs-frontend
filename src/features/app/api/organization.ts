import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import type { OrgSetupFormValues } from "../schemas/org-setup-schema"

export type CreateOrganizationResponse = {
  id: string
  name: string
  slug: string
  logo?: string | null
  metadata?: string | null
  createdAt: Date
  keys?: {
    success: boolean
    message: string
  }
}

export async function createOrganization(
  values: OrgSetupFormValues,
  logoUrl?: string
): Promise<CreateOrganizationResponse> {
  // Generate a URL-friendly slug from organization name
  const slug = values.organizationName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  // 1. Create organization using Better Auth client SDK
  const { data, error } = await authClient.organization.create({
    name: values.organizationName,
    slug,
    logo: logoUrl || undefined,
    metadata: {
      type: values.organizationType,
    },
  })

  if (error) {
    throw new Error(error.message || "Failed to create organization via Better Auth")
  }

  if (!data) {
    throw new Error("No organization data returned from Better Auth")
  }

  // 2. Set the newly created organization as active
  await authClient.organization.setActive({ organizationId: data.id })

  // 3. Call backend to generate keys for this organization
  let keys: { success: boolean; message: string } | undefined
  try {
    const keysResponse = await apiClient.post<{ success: boolean; message: string }>(
      "/organization/generate-keys",
      { orgId: data.id }
    )
    keys = keysResponse.data
  } catch (keysError) {
    keys = {
      success: false,
      message: keysError instanceof Error ? keysError.message : "Failed to generate keys",
    }
  }

  return {
    ...data,
    keys,
  }
}

export async function generateKeys(orgId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    "/organization/generate-keys",
    { orgId }
  )
  return response.data
}

export type DashboardStatsResponse = {
  organization: {
    id: string
    name: string
    slug: string
    logo?: string | null
    type?: string | null
    publicKey?: string | null
    createdAt: string
  }
  stats: {
    totalDocuments: number
    activeDocuments: number
    revokedDocuments: number
    totalVerifications: number
    verificationSuccessRate: number
  }
  recentDocuments: Array<{
    id: string
    title: string
    originalFilename: string
    fileUrl: string
    fileSize: number
    status: string
    createdAt: string
    signer: {
      name: string
      email: string
    }
  }>
  recentActivity: Array<{
    id: string
    documentId: string
    verificationType: string
    verificationResult: string
    verifiedByUserId?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    verificationTimestamp: string
    document: {
      title: string
    }
  }>
}

export async function fetchDashboardStats(orgId: string): Promise<DashboardStatsResponse> {
  const { data } = await apiClient.get<DashboardStatsResponse>(
    `/organization/dashboard-stats?orgId=${orgId}`
  )
  return data
}


