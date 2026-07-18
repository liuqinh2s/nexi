import Script from "next/script";
import { siteConfig } from "@/config/site";

export function Analytics() {
  if (!siteConfig.features.analytics || !siteConfig.analyticsId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.analyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${siteConfig.analyticsId}');`}
      </Script>
    </>
  );
}
