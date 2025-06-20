import { LoaderCircle } from "lucide-react";
import type { Route } from "./+types/otp-complete-page";
import { Form, redirect, useNavigation, useSearchParams } from "react-router";
import { z } from "zod";
import InputPair from "~/common/components/ui/input-pair";
import { Button } from "~/common/components/ui/button";
import { makeSSRClient } from "~/supa-client";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Verify OTP | startbeyond" }];
};

const formSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .min(6, "OTP must be 6 characters")
    .max(6, "OTP must be 6 characters"),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const { data, success, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!success) {
    return { fieldErrors: error.flatten().fieldErrors, verifyError: null };
  }

  const { email, otp } = data;
  const { client, headers } = makeSSRClient(request);
  const { error: verifyError } = await client.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });

  if (verifyError) {
    return { verifyError: verifyError.message, fieldErrors: null };
  }

  return redirect("/", { headers });
};

export default function OtpPage({ actionData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  return (
    <div className="flex flex-col relative items-center justify-center h-full">
      <div className="flex items-center flex-col justify-center w-full max-w-md gap-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Confirm OTP</h1>
          <p className="text-sm text-muted-foreground">
            Enter the OTP code sent to your email address.
          </p>
        </div>
        <Form className="w-full space-y-4" method="post">
          <input type="hidden" name="email" value={email ?? ""} />
          <InputPair
            label="OTP"
            description="Enter the 6-digit code sent to your email"
            name="otp"
            id="otp"
            required
            type="text"
            placeholder="123456"
            maxLength={6}
          />
          {actionData && "fieldErrors" in actionData && actionData.fieldErrors && (
            <p className="text-sm text-red-500">
              {actionData.fieldErrors.otp?.join(", ")}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Log in"}
          </Button>
          {actionData && "verifyError" in actionData && actionData.verifyError && (
            <p className="text-sm text-red-500">{actionData.verifyError}</p>
          )}
        </Form>
      </div>
    </div>
  );
}