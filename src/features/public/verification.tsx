import { useState, useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router"
import { useUploadThing } from "@/uploadthing"
import {
  verifyDocumentByToken,
  verifyDocumentByFile,
  type VerificationResponse,
} from "../app/api/documents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  MultiplicationSignCircleIcon,
  Alert02Icon,
  FileUploadIcon,
  Loading03Icon,
  InformationCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

const Verification = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResponse | null>(null)
  
  // File verification upload state
  const [dragActive, setDragActive] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const { startUpload } = useUploadThing("pdfUploader")

  const handleTokenVerification = async (verifyToken: string) => {
    setLoading(true)
    setResult(null)
    const toastId = toast.loading("Fetching document digital signatures...")
    try {
      const res = await verifyDocumentByToken(verifyToken)
      setResult(res)
      if (res.verified && res.documentStatus === "ACTIVE") {
        toast.success("Document verified successfully!", { id: toastId })
      } else if (res.documentStatus === "REVOKED") {
        toast.warning("Warning: Document has been revoked.", { id: toastId })
      } else if (res.result === "TAMPERED") {
        toast.error("Cryptographic signature mismatch! Content was altered.", { id: toastId })
      } else {
        toast.error("Document not found.", { id: toastId })
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || "Verification check failed.", { id: toastId })
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
    const toastId = toast.loading("Uploading temporary file for cryptographic analysis...")
    try {
      // 1. Upload to UploadThing
      const uploadRes = await startUpload([verifyFile])
      const uploadedFile = uploadRes?.[0]
      
      if (!uploadedFile) {
        throw new Error("Temporary file upload failed.")
      }

      // 2. Call backend to verify by file URL
      toast.loading("Calculating document SHA-256 and validating signature...", { id: toastId })
      const res = await verifyDocumentByFile(uploadedFile.url)
      setResult(res)

      if (res.verified && res.documentStatus === "ACTIVE") {
        toast.success("Cryptographic match found! Authentic document.", { id: toastId })
      } else if (res.documentStatus === "REVOKED") {
        toast.warning("Warning: Valid match, but document has been revoked.", { id: toastId })
      } else if (res.result === "TAMPERED") {
        toast.error("Cryptographic signature mismatch! Content was altered.", { id: toastId })
      } else {
        toast.error("No record of this document found in the ledger.", { id: toastId })
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err as { message?: string };
      toast.error(error.message || "File verification failed.", { id: toastId })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleReset = () => {
    setResult(null)
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <span className="bg-primary/20 text-primary border border-primary/30 size-8 rounded-lg flex items-center justify-center font-black">
              V
            </span>
            <span className="hidden sm:inline tracking-tight text-slate-200">VeriSign Portal</span>
          </Link>
          
          <Button asChild variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 text-slate-300 font-medium">
            <Link to="/auth/sign-in">
              Issuer Dashboard
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-xl flex flex-col gap-6">
          
          {/* Default/Initial portal info */}
          {!loading && !uploadingFile && !result && (
            <div className="text-center space-y-3 mb-4">
              <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 sm:text-4xl">
                Credential Verification
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Authenticate cryptographic credentials, academic transcripts, or letters using zero-trust RSA digital signatures.
              </p>
            </div>
          )}

          {/* Loader */}
          {(loading || uploadingFile) && (
            <Card className="border-slate-800 bg-slate-900 shadow-xl p-8 flex flex-col items-center text-center gap-4">
              <HugeiconsIcon icon={Loading03Icon} className="size-12 text-primary animate-spin" strokeWidth={2} />
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-200">
                  {loading ? "Decrypting Signatures" : "Uploading File"}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  {loading
                    ? "Fetching document hash, checking public keys, and verifying digital signatures..."
                    : "Sending PDF credential to analysis endpoint..."}
                </p>
              </div>
            </Card>
          )}

          {/* Results Render */}
          {!loading && !uploadingFile && result && (
            <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden animate-in fade-in duration-300">
              
              {/* Header result banner */}
              {result.verified && result.documentStatus === "ACTIVE" && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-5 flex items-center gap-3">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-10 text-emerald-400 shrink-0" strokeWidth={2} />
                  <div>
                    <h2 className="text-lg font-bold text-emerald-400">AUTHENTIC CREDENTIAL</h2>
                    <p className="text-xs text-emerald-400/80">Digital signature matches. The content is genuine and unmodified.</p>
                  </div>
                </div>
              )}

              {result.verified && result.documentStatus === "REVOKED" && (
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-5 flex items-center gap-3">
                  <HugeiconsIcon icon={Alert02Icon} className="size-10 text-rose-400 shrink-0" strokeWidth={2} />
                  <div>
                    <h2 className="text-lg font-bold text-rose-400">REVOKED CREDENTIAL</h2>
                    <p className="text-xs text-rose-400/80">This credential was valid but has since been revoked by the issuer.</p>
                  </div>
                </div>
              )}

              {result.result === "TAMPERED" && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-5 flex items-center gap-3">
                  <HugeiconsIcon icon={MultiplicationSignCircleIcon} className="size-10 text-red-400 shrink-0" strokeWidth={2} />
                  <div>
                    <h2 className="text-lg font-bold text-red-400">TAMPERED / INVALID</h2>
                    <p className="text-xs text-red-400/80">Signature mismatch. The document content was modified after signing.</p>
                  </div>
                </div>
              )}

              {result.result === "NOT_FOUND" && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-5 flex items-center gap-3">
                  <HugeiconsIcon icon={Alert02Icon} className="size-10 text-amber-400 shrink-0" strokeWidth={2} />
                  <div>
                    <h2 className="text-lg font-bold text-amber-400">UNREGISTERED FILE</h2>
                    <p className="text-xs text-amber-400/80">No digital signature matching this file was found in our ledger.</p>
                  </div>
                </div>
              )}

              <CardContent className="p-6 space-y-6">
                
                {/* Document Metadata if available */}
                {result.document && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-4">
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Credential Information
                      </div>
                      <h3 className="text-base font-bold text-slate-100">
                        {result.document.title}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {result.document.originalFilename} ({formatBytes(result.document.fileSize)})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-450 block font-semibold text-slate-400">Credential Type</span>
                        <span className="inline-flex items-center rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 mt-1 font-semibold text-slate-200">
                          {result.document.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-450 block font-semibold text-slate-400">Issuing Authority</span>
                        <span className="text-slate-200 font-medium block mt-1">
                          {result.organization?.name || "Unknown Issuer"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-450 block font-semibold text-slate-400">Date Issued</span>
                        <span className="text-slate-300 block mt-1">
                          {new Date(result.document.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-450 block font-semibold text-slate-400">Cryptographic Standard</span>
                        <span className="text-slate-300 font-mono block mt-1">
                          SHA-256 hashing + RSA-2048 Digital Signature
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Not found message details */}
                {result.result === "NOT_FOUND" && (
                  <div className="text-sm text-slate-400 leading-normal flex items-start gap-2 bg-slate-950 p-4 border border-slate-800 rounded-lg">
                    <HugeiconsIcon icon={InformationCircleIcon} className="size-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      This document either has not been issued through our platform, or the file was modified since signature generation. Double-check that you uploaded the original signed PDF.
                    </div>
                  </div>
                )}

                {/* Tampered warning details */}
                {result.result === "TAMPERED" && (
                  <div className="text-sm text-slate-400 leading-normal flex items-start gap-2 bg-slate-950 p-4 border border-slate-800 rounded-lg">
                    <HugeiconsIcon icon={InformationCircleIcon} className="size-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      The cryptographic validation failed. This indicates that one or more characters, images, or elements of the PDF file were altered. Do not trust the contents of this document.
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="bg-slate-950/40 p-4 border-t border-slate-800 flex justify-between gap-3">
                <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-800 hover:bg-slate-900 text-slate-300 font-medium">
                  Verify Another File
                </Button>
                {result.document && (
                  <Button asChild size="sm" className="font-semibold">
                    <a href={result.document.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      Download PDF
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Form manual Upload */}
          {!loading && !uploadingFile && !result && (
            <Card className="border-slate-800 bg-slate-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-200">Manual File Verification</CardTitle>
                <CardDescription className="text-slate-450">
                  Upload the issued PDF document to compute its cryptographic hash and cross-reference the ledger.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition-all text-center ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/10 bg-slate-950/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <HugeiconsIcon icon={FileUploadIcon} className="size-12 text-slate-400 mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-slate-200">
                    Drag & drop the signed PDF here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    or click to browse your local files
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 text-slate-500 py-6 text-center text-xs">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 VeriSign System. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/auth/sign-in" className="hover:text-slate-350">Dashboard</Link>
            <span className="text-slate-850">|</span>
            <a href="https://docs.uploadthing.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350">UploadThing API</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Verification