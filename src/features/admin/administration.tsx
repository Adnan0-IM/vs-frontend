import { authClient } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import SignOutButton from "../auth/components/SignOutButton"
import { UploadButton, UploadDropzone } from "@/uploadthing"

export type Session = typeof authClient.$Infer.Session
const Administration = () => {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: session, error } = await authClient.getSession()
      if (error || !session) {
        window.location.href = "/auth/sign-in"
      }
      setSession(session)
    }

    checkAuth()
  }, [])

  const user = session?.user
  return (
    <div className="container mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8 lg:px-4">
      <h1 className="text-2xl font-bold">Administration</h1>
      <p>Welcome to the administration panel.</p>
      <section className="mt-4">
        <h2>Admin Info</h2>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>ID: {user?.id}</p>
        <p>EmailVerified: {user?.emailVerified}</p>
        <div>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(file) => {
              console.log("uploaded", file)
              alert("Upload complete")
            }}
            onUploadAborted={() => {
              alert("Upload aborted")
            }}
            onUploadError={(error) => {
              console.error(error, error.cause)
              alert("Upload failed")
            }}
          />
          <UploadDropzone
            endpoint={(routeRegistry) => routeRegistry.pdfUploader}
            onClientUploadComplete={(file) => {
              console.log("uploaded", file)
              alert("Upload complete")
            }}
            onUploadError={(error) => {
              console.error(error, error.cause)
              alert("Upload failed")
            }}
          />
        </div>
      </section>
      <SignOutButton />
    </div>
  )
}

export default Administration
