import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { BackToApp } from "@/components/legal/LegalDoc";
import {
  CompanyLegalDocIndex,
  CompanyLegalEntity,
  CompanyLegalHeader,
  CompanyLegalPromises,
} from "@/components/legal/CompanyLegalParts";

const CompanyLegal = () => (
  <LandingLayout>
    <SEO
      title="Company & Legal · Kidzopedia"
      description="Kidzopedia's terms, privacy policy, data processing, cookie policy and grievance redressal — written to India's Digital Personal Data Protection Act, 2023."
    />

    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="mb-6 flex justify-end">
        <BackToApp />
      </div>
      <CompanyLegalHeader />
      <CompanyLegalPromises />
      <CompanyLegalDocIndex />
      <CompanyLegalEntity />
    </div>
  </LandingLayout>
);

export default CompanyLegal;
