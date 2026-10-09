import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { VerificationBanner } from "@/components/layout/VerificationBanner";
import { ContentForm } from "@/features/content/components/form/ContentForm";

export const metadata: Metadata = { title: "Upload video" };

export default function NewContentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Upload a video" description="Add your video and details. Save it as a draft, publish it now or schedule it." />
      <VerificationBanner />
      <ContentForm />
    </div>
  );
}
