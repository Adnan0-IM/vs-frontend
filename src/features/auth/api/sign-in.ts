import { authClient } from "@/lib/auth-client"

type SignInInput = {
  email: string
  password: string
  rememberMe?: boolean
}

export async function signIn(input: SignInInput) {
  const { error } = await authClient.signIn.email({
    email: input.email,
    password: input.password,
    rememberMe: input.rememberMe ?? false,
  })

  if (error) {
    throw new Error(error.message)
  }
}
