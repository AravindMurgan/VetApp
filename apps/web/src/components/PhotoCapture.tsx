import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AttachmentUploadResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { compressImage } from "../lib/compress-image";

export function PhotoCapture({ caseId, patientId }: { caseId: string; patientId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const compressed = await compressImage(file);
      const presign = await apiRequest<AttachmentUploadResponse>(`/cases/${caseId}/attachments`, {
        method: "POST",
        body: JSON.stringify({ contentType: compressed.type }),
      });

      const putResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": compressed.type },
        body: compressed,
      });
      if (!putResponse.ok) {
        throw new Error("Upload failed");
      }

      return presign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-profile", patientId] });
    },
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      uploadMutation.mutate(file);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-label="Add photo"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="text-sm font-medium text-primary underline disabled:opacity-50"
      >
        {uploadMutation.isPending ? "Uploading…" : "+ Add photo"}
      </button>
      {uploadMutation.isError ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          Unable to upload photo
        </p>
      ) : null}
    </div>
  );
}
