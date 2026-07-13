import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useCreateOrganization } from "./hooks/use-create-organization"
import { orgSetupSchema } from "./schemas/org-setup-schema"

const OrgSetup = () => {
  const [submitMessage, setSubmitMessage] = useState("")
  const [submitError, setSubmitError] = useState("")
  const navigate = useNavigate()
  const createOrganizationMutation = useCreateOrganization()

  const form = useForm<z.infer<typeof orgSetupSchema>>({
    resolver: zodResolver(orgSetupSchema),
    defaultValues: {
      organizationName: "",
      organizationType: "company",
      organizationLogo: undefined,
    },
  })

  const onSubmit = async (values: z.infer<typeof orgSetupSchema>) => {
    setSubmitMessage("")
    setSubmitError("")

    const createdOrganization = await createOrganizationMutation.mutateAsync(
      values
    )

    setSubmitMessage("Organization created successfully.")

    if (createdOrganization?.id) {
      navigate(`/dashboard/organization`)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6 md:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Organization setup
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Create your organization
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Start by naming your organization and choosing the type that best
          matches it. You can add a logo now or skip it and upload one later.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Organization details</CardTitle>
          <CardDescription>
            Fill in the details below to create a workspace for your team.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await onSubmit(values)
              } catch (error) {
                setSubmitError(
                  error instanceof Error
                    ? error.message
                    : "Unable to create the organization right now."
                )
              }
            })}
          >
            <FieldSet className="">
              <Controller
                name="organizationName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="organization-name">
                        Organization Name
                      </FieldLabel>
                      <p className="text-sm leading-normal text-muted-foreground">
                        This is the public name people will see across the app.
                      </p>
                      <Input
                        id="organization-name"
                        placeholder="Acme Inc."
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        aria-invalid={!!fieldState.error}
                        className="focus-visible:ring-2 focus-visible:ring-offset-0"
                        {...field}
                      />
                      {fieldState.error && (
                        <FieldDescription className="text-destructive">
                          {fieldState.error.message}
                        </FieldDescription>
                      )}
                    </div>
                  </Field>
                )}
              />

              <Controller
                name="organizationType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="organization-type">
                        Organization Type
                      </FieldLabel>
                      <FieldDescription>
                        Pick the category that best describes your organization.
                      </FieldDescription>
                      <div className="grid gap-3 md:grid-cols-2">
                        {[
                          { value: "university", label: "University" },
                          {
                            value: "secondary-school",
                            label: "Secondary School",
                          },
                          {
                            value: "government-agency",
                            label: "Government Agency",
                          },
                          { value: "company", label: "Company" },
                          { value: "other", label: "Other", span: true },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/60 has-checked:border-primary has-checked:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={option.value}
                              checked={field.value === option.value}
                              onChange={() => field.onChange(option.value)}
                              className="size-4 accent-primary"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {fieldState.error && (
                        <FieldDescription className="text-destructive">
                          {fieldState.error.message}
                        </FieldDescription>
                      )}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="organizationLogo"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="organization-logo">Logo</FieldLabel>
                      <FieldDescription>
                        Optional. Upload a logo in PNG, JPG, or SVG format.
                      </FieldDescription>
                      <Input
                        id="organization-logo"
                        type="file"
                        accept="image/*"
                        onChange={(event) => field.onChange(event.target.files)}
                      />
                      {fieldState.error && (
                        <FieldDescription className="text-destructive">
                          {fieldState.error.message}
                        </FieldDescription>
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldSet>
            {submitMessage && (
              <FieldDescription className="text-center text-primary">
                {submitMessage}
              </FieldDescription>
            )}
            {submitError && (
              <FieldDescription className="text-center text-destructive">
                {submitError}
              </FieldDescription>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || createOrganizationMutation.isPending}
              >
                {form.formState.isSubmitting || createOrganizationMutation.isPending
                  ? "Creating..."
                  : "Create organization"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            You can update these details later from organization settings.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default OrgSetup
