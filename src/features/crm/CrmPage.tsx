import { useSearchParams } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import type { CompanyLead, Contact, Deal, Offer } from '@/types/domain'
import { CompaniesTab } from './CompaniesTab'
import { ContactsTab } from './ContactsTab'
import { DealsTab } from './DealsTab'
import './crm.css'

type Tab = 'negociacoes' | 'contatos' | 'empresas'

const TABS: { key: Tab; label: string }[] = [
  { key: 'negociacoes', label: 'Negociações' },
  { key: 'contatos', label: 'Contatos' },
  { key: 'empresas', label: 'Empresas' },
]

export default function CrmPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('aba')
  const tab: Tab = raw === 'contatos' || raw === 'empresas' ? raw : 'negociacoes'

  const { items: deals } = useCollection<Deal>('deals')
  const { items: contacts } = useCollection<Contact>('contacts')
  const { items: companies } = useCollection<CompanyLead>('companies')
  const { items: offers } = useCollection<Offer>('offers')

  return (
    <div className="crm">
      <header className="page-intro">
        <h1>Sua organização comercial</h1>
        <p className="lede">
          Negociações, contatos e empresas em um lugar só, para você saber a quem voltar hoje sem depender da memória.
        </p>
      </header>

      <div className="crm__tabs" role="tablist" aria-label="Seções do CRM">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? 'crm__tab is-active' : 'crm__tab'}
            onClick={() => setParams(item.key === 'negociacoes' ? {} : { aba: item.key }, { replace: true })}
          >
            {item.label}
            <span className="crm__tab-count tabular">
              {item.key === 'negociacoes' ? deals.length : item.key === 'contatos' ? contacts.length : companies.length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'negociacoes' && <DealsTab deals={deals} contacts={contacts} companies={companies} offers={offers} />}
      {tab === 'contatos' && <ContactsTab contacts={contacts} companies={companies} />}
      {tab === 'empresas' && <CompaniesTab companies={companies} />}
    </div>
  )
}
