"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAccountSchema, type UpdateAccountInput } from "@peerconnect/validation";
import type { UserPrivateDTO } from "@peerconnect/types";
import { accountApi } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { FieldError } from "@/components/ui/FieldError";

export function ProfileEditForm({ user, onDone }: { user: UserPrivateDTO; onDone: () => void }) {
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateAccountInput>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      name: user.name,
      headline: user.headline ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  async function onSubmit(values: UpdateAccountInput) {
    setServerError(null);
    try {
      const { user: updated } = await accountApi.update(values);
      setUser(updated);
      toast.success("Profile updated.");
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            setError(field as keyof UpdateAccountInput, { message });
          }
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" error={errors.name?.message} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          placeholder="e.g. Product Designer at Acme"
          error={errors.headline?.message}
          {...register("headline")}
        />
        <FieldError message={errors.headline?.message} />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} error={errors.bio?.message} {...register("bio")} />
        <FieldError message={errors.bio?.message} />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" error={errors.location?.message} {...register("location")} />
        <FieldError message={errors.location?.message} />
      </div>

      <div>
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          placeholder="https://…"
          error={errors.avatarUrl?.message}
          {...register("avatarUrl")}
        />
        <FieldError message={errors.avatarUrl?.message} />
      </div>

      {serverError && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
