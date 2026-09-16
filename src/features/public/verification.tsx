import { useState, useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router"
import { useUploadThing } from "@/uploadthing"
import {
  verifyDocumentByToken,
  verifyDocumentByFile,
  type VerificationResponse,
} from "../app/api/documents"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  MultiplicationSignCircleIcon,
  Alert02Icon,
  FileUploadIcon,
  Loading03Icon,
  InformationCircleIcon,
  ArrowRight01Icon,
  DocumentValidationIcon,
  Github,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import GetStartedButton from "../home/components/GetStartedButton"
import Footer from "@/components/Footer"

const Verification = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResponse | null>(null)
  const [verificationMethod, setVerificationMethod] = useState<
    "token" | "file" | null
  >(null)

  // File verification upload state
  const [dragActive, setDragActive] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const { startUpload } = useUploadThing("pdfUploader")

  const handleTokenVerification = async (verifyToken: string) => {
    setLoading(true)
    setResult(null)
    setVerificationMethod("token")
    const toastId = toast.loading("Fetching document digital signatures...")
    try {
      const res = await verifyDocumentByToken(verifyToken)
      setResult(res)
      if (res.verified && res.documentStatus === "ACTIVE") {
        toast.success("Document verified successfully!", { id: toastId })
      } else if (res.documentStatus === "REVOKED") {
        toast.warning("Warning: Document has been revoked.", { id: toastId })
      } else if (res.result === "TAMPERED_HASH") {
        toast.error(
          "Hash mismatch! Document content was altered after signing.",
          {
            id: toastId,
          }
        )
      } else if (res.result === "TAMPERED_SIGNATURE") {
        toast.error("Invalid signature! Document may be forged or corrupted.", {
          id: toastId,
        })
      } else if (res.result === "STORAGE_ERROR") {
        toast.error("Unable to retrieve document from storage.", {
          id: toastId,
        })
      } else {
        toast.error("Invalid or expired verification token.", { id: toastId })
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err as {
        response?: { data?: { message?: string } }
        message?: string
      }
      toast.error(
        error.response?.data?.message || "Verification check failed.",
        { id: toastId }
      )
    } finally {
      setLoading(false)
    }
  }

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        handleTokenVerification(token)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [token])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type !== "application/pdf") {
        toast.error("Invalid file format. Only PDF files are supported.")
        return
      }
      await handleFileVerification(droppedFile)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        toast.error("Invalid file format. Only PDF files are supported.")
        return
      }
      await handleFileVerification(selectedFile)
    }
  }

  const handleFileVerification = async (verifyFile: File) => {
    setUploadingFile(true)
    setResult(null)
    setVerificationMethod("file")
    const toastId = toast.loading(
      "Uploading temporary file for cryptographic analysis..."
    )
    try {
      // 1. Upload to UploadThing
      const uploadRes = await startUpload([verifyFile])
      const uploadedFile = uploadRes?.[0]

      if (!uploadedFile) {
        throw new Error("Temporary file upload failed.")
      }

      // 2. Call backend to verify by file URL
      toast.loading(
        "Calculating document SHA-256 and validating signature...",
        { id: toastId }
      )
      const res = await verifyDocumentByFile(uploadedFile.url)
      setResult(res)

      if (res.verified && res.documentStatus === "ACTIVE") {
        toast.success("Cryptographic match found! Authentic document.", {
          id: toastId,
        })
      } else if (res.documentStatus === "REVOKED") {
        toast.warning("Warning: Valid match, but document has been revoked.", {
          id: toastId,
        })
      } else if (res.result === "MODIFIED_VERSION") {
        toast.warning(
          "Modified version detected! This file is similar to a registered document but has been altered.",
          {
            id: toastId,
          }
        )
      } else if (res.result === "TAMPERED_SIGNATURE") {
        toast.error("Invalid signature! Document may be forged or corrupted.", {
          id: toastId,
        })
      } else if (res.result === "NO_MATCHING_RECORD") {
        toast.error(
          "No matching document found. File may be modified or never signed.",
          {
            id: toastId,
          }
        )
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err as { message?: string }
      toast.error(error.message || "File verification failed.", { id: toastId })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setVerificationMethod(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatBytes = (bytes?: number, decimals = 2) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  return (
    <div className="container mx-auto min-h-screen max-w-5xl px-4 py-4 md:px-8 md:py-8 lg:px-4">
      {/* Navbar */}

      <header>
        <div className="flex items-center justify-between text-muted-foreground">
          <Link to={"/"}>
            <div className="flex items-center gap-2 font-bold">
              <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon size={16} icon={DocumentValidationIcon} />{" "}
              </div>
              <span>VeriDoc</span>{" "}
            </div>{" "}
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              className="hover:text-primary hover:underline"
              to={"/verification"}
            >
              {" "}
              Verify PDF
            </Link>
            <Link to={""}></Link>
            <Link to={""}>
              <HugeiconsIcon icon={Github} size={22} />
            </Link>
            <GetStartedButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-xl flex-col gap-6">
          {/* Default/Initial portal info */}
          {!loading && !uploadingFile && !result && (
            <div className="mb-4 space-y-3 text-center">
              <h1 className="text-3xl text-foreground sm:text-4xl">
                Credential Verification
              </h1>
              <p className="mx-auto max-w-md text-sm">
                Authenticate cryptographic credentials, academic transcripts, or
                letters using zero-trust RSA digital signatures.
              </p>
            </div>
          )}

          {/* Loader */}
          {(loading || uploadingFile) && (
            <Card className="flex flex-col items-center gap-4 border-border p-8 text-center shadow-xl">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-12 animate-spin text-primary"
                strokeWidth={2}
              />
              <div className="space-y-1">
                <h3 className="font-semibold">
                  {loading ? "Decrypting Signatures" : "Uploading File"}
                </h3>
                <p className="max-w-xs text-xs">
                  {loading
                    ? "Fetching document hash, checking public keys, and verifying digital signatures..."
                    : "Sending PDF credential to analysis endpoint..."}
                </p>
              </div>
            </Card>
          )}

          {/* Results Render */}
          {!loading && !uploadingFile && result && (
            <Card className="animate-in overflow-hidden border-border py-0 shadow-xl duration-300 fade-in">
              {/* Header result banner */}
              {result.verified && result.documentStatus === "ACTIVE" && (
                <div className="flex items-center gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-5">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-10 shrink-0 text-emerald-400"
                    strokeWidth={2}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-emerald-400">
                      AUTHENTIC CREDENTIAL
                    </h2>
                    <p className="text-xs text-emerald-400/80">
                      Digital signature matches. The content is genuine and
                      unmodified.
                    </p>
                  </div>
                </div>
              )}

              {result.verified && result.documentStatus === "REVOKED" && (
                <div className="flex items-center gap-3 border-b border-rose-500/20 bg-rose-500/10 px-6 py-5">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="size-10 shrink-0 text-rose-400"
                    strokeWidth={2}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-rose-400">
                      REVOKED CREDENTIAL
                    </h2>
                    <p className="text-xs text-rose-400/80">
                      This credential was valid but has since been revoked by
                      the issuer.
                    </p>
                  </div>
                </div>
              )}

              {result.result === "TAMPERED_HASH" && (
                <div className="flex items-center gap-3 border-b border-red-500/20 bg-red-500/10 px-6 py-5">
                  <HugeiconsIcon
                    icon={MultiplicationSignCircleIcon}
                    className="size-10 shrink-0 text-red-400"
                    strokeWidth={2}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-red-400">
                      TAMPERED / INVALID
                    </h2>
                    <p className="text-xs text-red-400/80">
                      Document content was modified after signing. Hash mismatch
                      detected.
                    </p>
                  </div>
                </div>
              )}

              {result.result === "TAMPERED_SIGNATURE" && (
                <div className="flex items-center gap-3 border-b border-red-500/20 bg-red-500/10 px-6 py-5">
                  <HugeiconsIcon
                    icon={MultiplicationSignCircleIcon}
                    className="size-10 shrink-0 text-red-400"
                    strokeWidth={2}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-red-400">
                      TAMPERED / INVALID
                    </h2>
                    <p className="text-xs text-red-400/80">
                      Invalid digital signature. Document may be forged or
                      corrupted.
                    </p>
                  </div>
                </div>
              )}

              {result.result === "STORAGE_ERROR" && (
                <div className="flex items-center gap-3 border-b border-red-500/20 bg-red-500/10 px-6 py-5">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="size-10 shrink-0 text-red-400"
                    strokeWidth={2}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-red-400">
                      STORAGE ERROR
                    </h2>
                    <p className="text-xs text-red-400/80">
                      Unable to retrieve document file from storage for
                      verification.
                    </p>
                  </div>
                </div>
              )}
              {result.result === "NO_MATCHING_RECORD" && (
                <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-6 py-5">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="size-10 shrink-0 text-amber-400"
                    strokeWidth={2}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-amber-400">
                      NOT REGISTERED
                    </h2>
                    <p className="text-xs text-amber-400/80">
                      No document with this exact content exists in our ledger.
                      The file was either never registered or has been modified.
                    </p>
                  </div>
                </div>
              )}

              {verificationMethod === "token" &&
                result.result === "NOT_FOUND" && (
                  <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-6 py-5">
                    <HugeiconsIcon
                      icon={Alert02Icon}
                      className="size-10 shrink-0 text-amber-400"
                      strokeWidth={2}
                    />
                    <div>
                      <h2 className="text-lg font-bold text-amber-400">
                        INVALID QR CODE
                      </h2>
                      <p className="text-xs text-amber-400/80">
                        No document found for this verification token. The QR
                        code may be invalid, expired, or the document was never
                        issued through our platform.
                      </p>
                    </div>
                  </div>
                )}

              <CardContent className="space-y-6 p-6">
                {/* Document Metadata if available */}
                {result.document && (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-4">
                      <div className="mb-1 text-xs font-semibold tracking-wider uppercase">
                        Credential Information
                      </div>
                      <h3 className="text-base font-bold">
                        {result.document.title}
                      </h3>
                      <div className="mt-0.5 text-xs">
                        {result.document.originalFilename} (
                        {formatBytes(result.document.fileSize)})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-450 block font-semibold">
                          Credential Type
                        </span>
                        <span className="mt-1 inline-flex items-center rounded-md border border-border px-2 py-0.5 font-semibold text-slate-200">
                          {result.document.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-450 block font-semibold">
                          Issuing Authority
                        </span>
                        <span className="mt-1 block font-medium">
                          {result.organization?.name || "Unknown Issuer"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-450 block font-semibold">
                          Date Issued
                        </span>
                        <span className="mt-1 block">
                          {new Date(result.document.createdAt).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-450 block font-semibold">
                          Cryptographic Standard
                        </span>
                        <span className="mt-1 block font-mono">
                          SHA-256 hashing + RSA-2048 Digital Signature
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Token: Invalid QR code */}
                {verificationMethod === "token" &&
                  result.result === "NOT_FOUND" && (
                    <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-normal text-slate-400">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        className="mt-0.5 size-5 shrink-0 text-amber-400"
                      />
                      <div>
                        No document found for this verification token. The QR
                        code may be invalid, expired, or the document was never
                        issued through our platform.
                      </div>
                    </div>
                  )}

                {/* File: No matching record */}
                {verificationMethod === "file" &&
                  result.result === "NO_MATCHING_RECORD" && (
                    <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-normal text-slate-400">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        className="mt-0.5 size-5 shrink-0 text-amber-400"
                      />
                      <div>
                        <strong>File Not Found in Registry</strong>
                        <br />
                        This file's content does not match any registered
                        document. This means either:
                        <br />
                        • The document was never registered in our system, OR
                        <br />
                        • The file was modified after signing (even a single
                        character change)
                        <br />
                        Please verify you uploaded the original, unmodified
                        signed PDF.
                      </div>
                    </div>
                  )}

                {/* Token: Hash mismatch (tampered) */}
                {verificationMethod === "token" &&
                  result.result === "TAMPERED_HASH" && (
                    <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-normal text-slate-400">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        className="mt-0.5 size-5 shrink-0 text-red-400"
                      />
                      <div>
                        The document hash does not match the signed version.
                        This indicates the PDF content was modified after
                        signing. Changes to text, images, or metadata will cause
                        this mismatch. Do not trust this document.
                      </div>
                    </div>
                  )}

                {/* Both: Invalid signature */}
                {result.result === "TAMPERED_SIGNATURE" && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-normal text-slate-400">
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      className="mt-0.5 size-5 shrink-0 text-red-400"
                    />
                    <div>
                      The digital signature is invalid. This document may be
                      forged, corrupted, or signed with a different key. Do not
                      trust the contents of this document.
                    </div>
                  </div>
                )}

                {/* Token: Storage error */}
                {verificationMethod === "token" &&
                  result.result === "STORAGE_ERROR" && (
                    <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-normal text-slate-400">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        className="mt-0.5 size-5 shrink-0 text-red-400"
                      />
                      <div>
                        The document file could not be retrieved from storage.
                        It may have been deleted or is temporarily unavailable.
                        Contact the issuer for a re-issued document.
                      </div>
                    </div>
                  )}
              </CardContent>

              <CardFooter className="flex justify-between gap-3 border-t p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="font-medium"
                >
                  Verify Another File
                </Button>
                {result.document && (
                  <Button asChild size="sm" className="font-semibold">
                    <a
                      href={result.document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Download PDF
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="size-4"
                      />
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Form manual Upload */}
          {!loading && !uploadingFile && !result && (
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  Manual File Verification
                </CardTitle>
                <CardDescription className="">
                  Upload the issued PDF document to compute its cryptographic
                  hash and cross-reference the ledger.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-all ${
                    dragActive ? "border-border" : ""
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <HugeiconsIcon
                    icon={FileUploadIcon}
                    className="mb-3 size-12"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium">
                    Drag & drop the signed PDF here
                  </p>
                  <p className="mt-1 text-xs">
                    or click to browse your local files
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Verification
