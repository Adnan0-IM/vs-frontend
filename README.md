# VeriDoc App Overview

This app is a document credential and verification platform built around cryptographic trust. Its purpose is to let organizations issue signed PDF documents, track them, and let anyone verify that a document is authentic and unchanged.

## What the app does

### 1. User authentication and onboarding

The app uses Better Auth for sign-in, sign-up, session management, and organization membership.

- Public routes:
  - `/` home page
  - `/auth/sign-in`
  - `/auth/sign-up`
  - `/verification`
  - `/invitation/:invitationId`

- Protected routes:
  - `/dashboard`
  - `/dashboard/org-setup`
  - `/dashboard/documents`
  - `/dashboard/upload-document`
  - `/dashboard/verification-logs`
  - `/dashboard/members`
  - `/dashboard/settings`

The router enforces access by calling `authClient.getSession()` and redirecting unauthenticated users to sign-in.

### 2. Organization setup and membership

After sign-in, users can create or join an organization. The app supports:

- organization creation
- organization type metadata
- active organization selection
- invitation-based member onboarding
- member and role management

This is handled through Better Auth organization plugins and custom org setup flows.

### 3. Dashboard for organization-level insight

The main dashboard gives a high-level overview of the organization’s credential ecosystem:

- total documents issued
- active documents
- revoked documents
- total verifications
- verification success rate

It also shows recent documents and recent verification activity.

### 4. Digital document issuance and signing

Users can issue and sign PDF documents from the dashboard.

The flow generally includes:

- choosing a document type
- uploading a PDF
- adding metadata such as title and original filename
- generating a cryptographic hash/signature
- storing the signed document metadata and verification token
- issuing a verification link that can be checked publicly

The document API layer includes calls such as:

- `fetchDocuments`
- `uploadAndSignDocument`
- `revokeDocument`
- `fetchVerificationLogs`
- `verifyDocumentByToken`
- `verifyDocumentByFile`

### 5. Verification portal for public trust checks

There is a public verification page at `/verification` where anyone can:

- paste a verification token and validate a document
- upload a PDF to check its cryptographic integrity
- detect whether a document is:
  - `VERIFIED`
  - `TAMPERED`
  - `NOT_FOUND`
  - `REVOKED`

This works by checking the document’s stored hash/signature against the uploaded file or token-backed document record.

### 6. Member and admin controls

The app supports organization administration through screens for:

- members
- invitations
- role-based permissions
- settings

Roles likely include:

- owner
- admin
- member

The front end checks roles to toggle access to sensitive actions like revoking documents or deleting organizations.

### 7. Settings and account management

Users can manage:

- display name
- password change
- organization identity
- organization metadata
- public verification key display/copy
- delete personal account
- delete organization (owner-only)

### 8. Security and trust model

The app is explicitly designed around authenticity, integrity, and non-repudiation.

Notable patterns in the code:

- cryptographic verification and document signatures
- QR-or-token-based verification flow
- SHA/hash verification logic on public verification pages
- revocation handling for invalidated credentials
- organization-scoped permissions

## Main routes

| Route                          | Purpose                          |
| ------------------------------ | -------------------------------- |
| `/`                            | marketing/home page              |
| `/auth/sign-in`                | sign in                          |
| `/auth/sign-up`                | sign up                          |
| `/verification`                | public document verification     |
| `/invitation/:invitationId`    | accept organization invitation   |
| `/dashboard`                   | main org dashboard               |
| `/dashboard/org-setup`         | create organization              |
| `/dashboard/documents`         | list and manage signed documents |
| `/dashboard/upload-document`   | create and sign a document       |
| `/dashboard/verification-logs` | audit verification attempts      |
| `/dashboard/members`           | manage org members and invites   |
| `/dashboard/settings`          | account and org settings         |

## Tech stack

The frontend is a React + TypeScript + Vite app with:

- React Router for routing
- TanStack Query for async data fetching
- Better Auth for auth and org permissions
- custom API wrappers for backend calls
- Tailwind-style UI components and shadcn patterns
- Sonner for toast notifications

## In one sentence

VeriDoc is a secure credential issuance and verification platform for organizations to issue signed documents, manage memberships, and publicly validate document authenticity without tampering.

