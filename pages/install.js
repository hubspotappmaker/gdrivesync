import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Install() {
  const router = useRouter();

  useEffect(() => {
    const clientId = '3c24e4a5-2677-4e9a-9022-f72c0218f80a';
    const redirectUri = encodeURIComponent("https://gdrive.onextdigital.com/fe/api/hubspot/callback");
    const scope = encodeURIComponent("contacts");

    const authUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=06593d8a-656b-40cc-a0ec-63c11bf7c5c3&redirect_uri=https://gdrive.onextdigital.com/fe/api/hubspot/callback&scope=crm.objects.contacts.write%20crm.objects.deals.read%20crm.objects.deals.write%20crm.objects.contacts.read`;

    // Chuyển hướng đến HubSpot
    window.location.href = authUrl;
  }, []);

  return (
    <p>Đang chuyển hướng tới HubSpot để xác thực...</p>
  );
}
