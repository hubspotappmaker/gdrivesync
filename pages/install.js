import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Install() {
  const router = useRouter();

  useEffect(() => {
    const clientId = '3c24e4a5-2677-4e9a-9022-f72c0218f80a';
    const redirectUri = encodeURIComponent("https://gdrive.onextdigital.com/api/hubspot/callback");
    const scope = encodeURIComponent("contacts");

    const authUrl = `https://app-eu1.hubspot.com/oauth/authorize?client_id=3c24e4a5-2677-4e9a-9022-f72c0218f80a&redirect_uri=https://gdrive.onextdigital.com/api/hubspot/callback&scope=oauth%20crm.objects.contacts.read&optional_scope=crm.objects.contacts.write%20crm.schemas.contacts.write%20crm.schemas.deals.read%20crm.schemas.deals.write%20crm.dealsplits.read_write%20crm.objects.deals.read%20crm.schemas.contacts.read%20crm.objects.deals.write`;

    // Chuyển hướng đến HubSpot
    window.location.href = authUrl;
  }, []);

  return (
    <p>Đang chuyển hướng tới HubSpot để xác thực...</p>
  );
}
