import { useState } from "react";
import { PYLON_API_BASE_URL } from "@/libs/monetic-sdk";

import { truncateAddress } from "@/utils/helpers";

interface FileUploadState {
  type: "image" | "screenshot";
  name?: string;
  file?: File;
  previewUrl?: string;
  isLoading?: boolean;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState<FileUploadState | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setAttachment({
      type: "image",
      name: truncateAddress(file.name),
      file,
      isLoading: true,
    });

    try {
      // Get upload URL from Pylon
      const {
        data: {
          data: { uploadUrl, accessUrl },
        },
      } = await (
        await fetch(`${PYLON_API_BASE_URL}/v1/merchant/chat/file/upload`, {
          method: "POST",
          body: JSON.stringify({
            mimeType: file.type,
            fileName: file.name,
          }),
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
        })
      ).json();

      // Create preview while uploading
      const reader = new FileReader();

      reader.onload = (e) => {
        setAttachment((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            previewUrl: e.target?.result?.toString(),
          };
        });
      };
      reader.readAsDataURL(file);

      // Upload file
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      setAttachment((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          isLoading: false,
          previewUrl: accessUrl,
        };
      });

      return accessUrl;
    } catch (error) {
      console.error("Failed to upload file:", error);
      setAttachment(null);

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  return {
    attachment,
    isUploading,
    uploadFile,
    clearAttachment,
    setAttachment,
  };
};
