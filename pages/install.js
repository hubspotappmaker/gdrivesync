import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Install() {
  const router = useRouter();

  useEffect(() => {
    const clientId = '3c24e4a5-2677-4e9a-9022-f72c0218f80a';
    const redirectUri = encodeURIComponent("https://gdrive.nexce.io/fe/api/hubspot/callback");
    const scope = encodeURIComponent("contacts");

    const authUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=ed661cf6-11ca-4441-8f9f-dcc884d8e6f9&redirect_uri=https://gdrive.nexce.io/fe/api/hubspot/callback&scope=crm.objects.deals.read%20crm.objects.contacts.read`;

    // Chuyển hướng đến HubSpot
    window.location.href = authUrl;
  }, []);

  return (
    <p>Đang chuyển hướng tới HubSpot để xác thực...</p>
  );
}
