import DonationDetailClient from './DonationDetailClient'

export default async function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  return <DonationDetailClient 
    donationId={resolvedParams.id} 
    initialDonation={null}
    initialMatches={[]}
  />
}