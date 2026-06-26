import { authClient } from "@/lib/auth-client"

type SignUpInput = {
  email: string
  password: string
  name: string
  image?: string
}

export async function signUp(input: SignUpInput) {
  const { error } = await authClient.signUp.email({
    email: input.email,
    password: input.password,
    name: input.name,
    image: input.image,
    callbackURL: "/dashboard",
  })

  if (error) {
    throw new Error(error.message)
  }
}
