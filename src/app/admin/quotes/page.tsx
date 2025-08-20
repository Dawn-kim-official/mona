'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase-types'

type Quote = Database['public']['Tables']['quotes']['Row'] & {
  donations: {
    description: string
    businesses: {
      name: string
    }
  }
}

export default function AdminQuotesPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [needsQuote, setNeedsQuote] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newQuote, setNewQuote] = useState({ donationId: '', amount: '', paymentTerms: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // 기존 견적 조회
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        donations (
          description,
          businesses (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError)
    } else {
      setQuotes(quotesData || [])
    }

    // 견적이 필요한 기부 조회
    const { data: donationsData, error: donationsError } = await supabase
      .from('donations')
      .select(`
        *,
        businesses (
          name
        )
      `)
      .eq('status', 'matched')
      .order('created_at', { ascending: false })

    if (donationsError) {
      console.error('Error fetching donations:', donationsError)
    } else {
      setNeedsQuote(donationsData || [])
    }

    setLoading(false)
  }

  async function createQuote() {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('quotes')
      .insert({
        donation_id: newQuote.donationId,
        amount: parseFloat(newQuote.amount),
        payment_terms: newQuote.paymentTerms,
        sent_by: user?.id,
        status: 'sent'
      })

    if (error) {
      console.error('Error creating quote:', error)
    } else {
      // 기부 상태 업데이트
      await supabase
        .from('donations')
        .update({ status: 'quote_sent' })
        .eq('id', newQuote.donationId)

      setNewQuote({ donationId: '', amount: '', paymentTerms: '' })
      fetchData()
    }
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  return (
    <div>
      <h2>견적 관리</h2>

      <div>
        <h3>견적 발송이 필요한 기부</h3>
        {needsQuote.length === 0 ? (
          <p>견적 발송이 필요한 기부가 없습니다.</p>
        ) : (
          <div>
            {needsQuote.map((donation) => (
              <div key={donation.id}>
                <p>{donation.businesses?.name} - {donation.description}</p>
                <input
                  type="number"
                  placeholder="금액"
                  value={newQuote.donationId === donation.id ? newQuote.amount : ''}
                  onChange={(e) => setNewQuote({ ...newQuote, donationId: donation.id, amount: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="결제 조건"
                  value={newQuote.donationId === donation.id ? newQuote.paymentTerms : ''}
                  onChange={(e) => setNewQuote({ ...newQuote, donationId: donation.id, paymentTerms: e.target.value })}
                />
                <button onClick={createQuote}>견적 발송</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3>발송된 견적</h3>
        {quotes.length === 0 ? (
          <p>발송된 견적이 없습니다.</p>
        ) : (
          <div>
            {quotes.map((quote) => (
              <div key={quote.id}>
                <p>{quote.donations?.businesses?.name} - {quote.donations?.description}</p>
                <p>금액: {quote.amount}원</p>
                <p>결제 조건: {quote.payment_terms}</p>
                <p>상태: {quote.status}</p>
                <p>발송일: {new Date(quote.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}