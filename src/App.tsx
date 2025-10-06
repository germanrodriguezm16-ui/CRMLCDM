import React, { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Users, LayoutDashboard, KanbanSquare, ShoppingCart, CheckSquare, BarChart2, Plus, Send, Search, Tag, Phone, Mail, Upload, ArrowRight, ArrowLeft, Trash2, X, ServerCog } from 'lucide-react'

// ======================================================
// CRM LCDM – Prototipo completo (mismo baseline estable)
// Módulos: Inicio, Clientes (con modal), Inbox, Embudo, Pedidos,
//          Tareas, Reportes y Admin. Persistencia en localStorage.
// ======================================================

type Cliente = {
  id: string
  nombre: string
  telefono: string
  email?: string
  etiquetas?: string[]
  totalPedidos?: number
  nota?: string
  ultimoContacto?: string
}

type Conversacion = {
  id: string
  clienteId: string
  canal: 'WhatsApp' | 'Otro'
  abierto: boolean
  mensajes: { id: number; dir: 'IN' | 'OUT'; texto: string; ts: string }[]
}

type Deal = {
  id: string
  clienteId: string
  titulo: string
  valor: number
  etapa: (typeof STAGES)[number]
}

type Pedido = {
  id: string
  clienteId: string
  total: number
  estado: 'Pendiente' | 'Facturado' | 'Entregado'
  fecha: string
}

type Tarea = {
  id: string
  clienteId: string
  titulo: string
  vence: string
  estado: 'Pendiente' | 'Hecha'
}

const STAGES = ['Nuevo','Contactado','Cotizado','Pagado','Entregado'] as const
const currency = (n: number) => Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow">
      <div className="text-zinc-400 text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-zinc-500 mt-1">{hint}</div>}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700">
      <Tag size={12} /> {children}
    </span>
  )
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="text-sm font-semibold text-zinc-200">{title}</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800" aria-label="Cerrar"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// -------- Datos por defecto (baseline)
const defaultClients: Cliente[] = [
  { id: 'C-001', nombre: 'Juan Pérez', telefono: '+57 300 123 4567', email: 'juan@example.com', etiquetas: ['Recurrente','WhatsApp'], totalPedidos: 6, ultimoContacto: '2025-10-02' },
  { id: 'C-002', nombre: 'Ferretería El Martillo', telefono: '+57 310 555 9911', email: 'compras@martillo.com', etiquetas: ['Mayorista'], totalPedidos: 11, ultimoContacto: '2025-10-04' },
  { id: 'C-003', nombre: 'Lina Gómez', telefono: '+57 312 222 1111', email: 'lina@example.com', etiquetas: ['Instagram'], totalPedidos: 2, ultimoContacto: '2025-10-03' },
]

const defaultConversations: Conversacion[] = [
  { id: 'W-1001', clienteId: 'C-001', canal: 'WhatsApp', abierto: true, mensajes: [
    { id: 1, dir: 'IN',  texto: 'Hola, ¿tienen chaqueta impermeable talla M?', ts: '2025-10-02 08:21' },
    { id: 2, dir: 'OUT', texto: '¡Hola Juan! Sí, tenemos dos modelos. ¿prefieres negra o reflectiva?', ts: '2025-10-02 08:23' },
  ]},
  { id: 'W-1002', clienteId: 'C-002', canal: 'WhatsApp', abierto: true, mensajes: [
    { id: 1, dir: 'IN',  texto: 'Coticemos 10 intercomunicadores', ts: '2025-10-04 10:12' },
    { id: 2, dir: 'OUT', texto: 'Claro, te paso la proforma en un momento.', ts: '2025-10-04 10:14' },
  ]},
]

const defaultDeals: Deal[] = [
  { id: 'O-001', clienteId: 'C-001', titulo: 'Chaqueta impermeable M', valor: 130000,  etapa: 'Nuevo' },
  { id: 'O-002', clienteId: 'C-002', titulo: '10 intercomunicadores',  valor: 2800000, etapa: 'Cotizado' },
  { id: 'O-003', clienteId: 'C-003', titulo: 'Rodilleras + Guantes',   valor: 240000,  etapa: 'Contactado' },
]

const defaultOrders: Pedido[] = [
  { id: 'P-100', clienteId: 'C-001', total: 130000,  estado: 'Pendiente', fecha: '2025-10-02' },
  { id: 'P-101', clienteId: 'C-002', total: 2800000, estado: 'Facturado', fecha: '2025-10-04' },
]

const defaultTasks: Tarea[] = [
  { id: 'T-01', clienteId: 'C-002', titulo: 'Enviar proforma 10 intercomunicadores', vence: '2025-10-05 15:00', estado: 'Pendiente' },
  { id: 'T-02', clienteId: 'C-001', titulo: 'Confirmar talla y color',   vence: '2025-10-05 11:30', estado: 'Pendiente' },
]

// -------- Vistas
function Inicio({ clients, deals, orders }: { clients: Cliente[]; deals: Deal[]; orders: Pedido[] }) {
  const totalPeriodo = orders.reduce((a, o) => a + (o.total || 0), 0)
  const abiertas = deals.filter(d => d.etapa !== 'Entregado').length
  const nuevas = deals.filter(d => d.etapa === 'Nuevo').length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Pedidos del periodo" value={currency(totalPeriodo)} hint="Suma de pedidos" />
        <Stat label="Oportunidades abiertas" value={String(abiertas)} hint="Aún en proceso" />
        <Stat label="Oportunidades nuevas" value={String(nuevas)} hint="Entrada reciente" />
        <Stat label="Clientes" value={String(clients.length)} hint="Activos en CRM" />
      </div>
      <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900">
        <div className="text-zinc-300">Bienvenido al CRM de LCDM. Usa el menú para navegar.</div>
      </div>
    </div>
  )
}

function Clientes({ clients, setClients }: { clients: Cliente[]; setClients: (c: Cliente[]) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '' })

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return clients.filter(c => [c.nombre, c.telefono, c.email || ''].some(v => String(v).toLowerCase().includes(s)))
  }, [q, clients])

  const reset = () => setForm({ nombre: '', telefono: '', email: '' })
  const add = () => {
    if (!form.nombre.trim() || !form.telefono.trim()) return
    const id = `C-${Math.floor(Math.random() * 900) + 100}`
    setClients([...clients, { id, nombre: form.nombre.trim(), telefono: form.telefono.trim(), email: form.email.trim(), etiquetas: ['WhatsApp'], totalPedidos: 0, ultimoContacto: new Date().toISOString().slice(0,10) }])
    reset(); setOpen(false)
  }
  const remove = (id: string) => setClients(clients.filter(c => c.id !== id))
  const importarTxt = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    setClients(clients.map(c => c.id === id ? { ...c, nota: `${c.nota || ''}\n\n— HISTORIAL IMPORTADO (${file.name}) —\n${text}` } : c))
    e.target.value = ''
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && open) add() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, form])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
          <Search size={16} className="text-zinc-500" />
          <input className="bg-transparent outline-none text-sm" placeholder="Buscar clientes" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setOpen(true)} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium flex items-center gap-2"><Plus size={16} /> Agregar</button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950 text-zinc-400">
            <tr>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Etiquetas</th>
              <th className="text-left p-3">Pedidos</th>
              <th className="text-left p-3">Nota / Historial</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                <td className="p-3 font-medium text-zinc-200">{c.nombre}</td>
                <td className="p-3"><div className="flex items-center gap-2 text-zinc-300"><Phone size={14} />{c.telefono}</div></td>
                <td className="p-3"><div className="flex items-center gap-2 text-zinc-300"><Mail size={14} />{c.email || '—'}</div></td>
                <td className="p-3 flex flex-wrap gap-1">{(c.etiquetas || []).map((e, i) => <Badge key={i}>{e}</Badge>)}</td>
                <td className="p-3">{c.totalPedidos || 0}</td>
                <td className="p-3 max-w-[280px]"><div className="text-xs text-zinc-300 whitespace-pre-wrap line-clamp-3">{c.nota || '—'}</div></td>
                <td className="p-3 flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <Upload size={14} /><span>Importar .txt</span>
                    <input type="file" accept=".txt" className="hidden" onChange={e => importarTxt(e, c.id)} />
                  </label>
                  <button onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-zinc-800" title="Eliminar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo cliente" footer={<>
        <button onClick={() => setOpen(false)} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm">Cancelar</button>
        <button onClick={add} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium">Guardar</button>
      </>}>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Nombre *</div>
            <input autoFocus className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" placeholder="Ej. Juan Pérez" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Teléfono *</div>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" placeholder="Ej. +57 300 000 0000" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Email</div>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" placeholder="correo@dominio.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="text-xs text-zinc-500">Los campos marcados con * son obligatorios.</div>
        </div>
      </Modal>
    </div>
  )
}

function Inbox({ conversations, setConversations, clients }: { conversations: Conversacion[]; setConversations: (x: Conversacion[]) => void; clients: Cliente[] }) {
  const [selected, setSelected] = useState(conversations[0]?.id || '')
  const conv = useMemo(() => conversations.find(c => c.id === selected), [conversations, selected])
  const cliente = useMemo(() => clients.find(x => x.id === conv?.clienteId), [clients, conv])
  const [msg, setMsg] = useState('')

  const send = () => {
    if (!conv || !msg.trim()) return
    const updated = conversations.map(c => c.id !== conv.id ? c : { ...c, mensajes: [...c.mensajes, { id: c.mensajes.length + 1, dir: 'OUT', texto: msg.trim(), ts: new Date().toISOString().slice(0,16).replace('T',' ') }] })
    setConversations(updated); setMsg('')
  }
  const simulateIncoming = (texto?: string) => {
    if (!conv) return
    const phrases = ['¿Me confirmas disponibilidad hoy?','¿Tienen en XL?','¿Cuánto tarda el envío?','¿Me guardas 2 unidades?']
    const pick = texto || phrases[Math.floor(Math.random() * phrases.length)]
    const updated = conversations.map(c => c.id !== conv.id ? c : { ...c, mensajes: [...c.mensajes, { id: c.mensajes.length + 1, dir: 'IN', texto: pick, ts: new Date().toISOString().slice(0,16).replace('T',' ') }] })
    setConversations(updated)
  }
  const templates = ['¡Hola! Soy LCDM. ¿En qué puedo ayudarte hoy?','Gracias por escribirnos. Te comparto catálogo y precios.','Tu pedido está en preparación.']

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-4 flex flex-col rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center gap-2">
          <Search size={16} className="text-zinc-500" />
          <input placeholder="Buscar conversaciones" className="bg-transparent outline-none w-full text-sm" />
        </div>
        <div className="flex-1 overflow-auto divide-y divide-zinc-900">
          {conversations.map(c => {
            const cli = clients.find(x => x.id === c.clienteId)
            const last = c.mensajes[c.mensajes.length - 1]
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left p-3 hover:bg-zinc-900 ${selected === c.id ? 'bg-zinc-900' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-zinc-200">{cli?.nombre}</div>
                  <div className="text-xs text-zinc-500">{c.canal}</div>
                </div>
                <div className="text-xs text-zinc-400 line-clamp-1">{last?.texto}</div>
              </button>
            )
          })}
        </div>
      </div>
      <div className="col-span-8 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
        {conv ? (
          <>
            <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-300">
                <MessageSquare size={18} />
                <span className="font-medium">{cliente?.nombre}</span>
                <Badge>{cliente?.telefono}</Badge>
              </div>
              <div className="flex gap-2 text-xs">
                {templates.map((t, i) => (
                  <button key={i} onClick={() => simulateIncoming(t)} className="rounded-lg border border-zinc-800 px-2 py-1 hover:bg-zinc-800">Plantilla {i + 1}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2 bg-zinc-950">
              {conv.mensajes.map(m => (
                <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.dir === 'IN' ? 'bg-zinc-800 text-zinc-100' : 'bg-emerald-600 text-white ml-auto'}`}>
                  <div>{m.texto}</div>
                  <div className="text-[10px] opacity-70 mt-1">{m.ts}</div>
                </div>
              ))}
            </div>
            <div className="p-3 flex gap-2 border-t border-zinc-800 bg-zinc-950">
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none" placeholder="Escribe un mensaje…" />
              <button onClick={send} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium"><Send size={16} /> Enviar</button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-zinc-400">Selecciona una conversación</div>
        )}
      </div>
    </div>
  )
}

function Embudo({ deals, setDeals, clients }: { deals: Deal[]; setDeals: (x: Deal[]) => void; clients: Cliente[] }) {
  const move = (id: string, dir: 1 | -1) => {
    setDeals(deals.map(d => d.id !== id ? d : { ...d, etapa: STAGES[Math.min(Math.max(STAGES.indexOf(d.etapa) + dir, 0), STAGES.length - 1)] }))
  }
  const addDeal = () => {
    const c = clients[0]
    const id = `O-${Math.floor(Math.random() * 900) + 100}`
    setDeals([...deals, { id, clienteId: c.id, titulo: 'Nuevo negocio', valor: 100000, etapa: 'Nuevo' }])
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-zinc-300">Usa los botones para mover entre etapas.</div>
        <button onClick={addDeal} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium"><Plus size={16} /> Añadir oportunidad</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {STAGES.map(s => (
          <div key={s} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="text-sm font-semibold text-zinc-200 mb-2">{s}</div>
            <div className="space-y-2 min-h-[120px]">
              {deals.filter(d => d.etapa === s).map(d => {
                const cli = clients.find(x => x.id === d.clienteId)
                return (
                  <div key={d.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                    <div className="font-medium text-zinc-100 text-sm line-clamp-1">{d.titulo}</div>
                    <div className="text-xs text-zinc-400 line-clamp-1">{cli?.nombre}</div>
                    <div className="text-sm mt-1">{currency(d.valor)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => move(d.id, -1)} className="p-2 rounded-lg hover:bg-zinc-800" title="Retroceder"><ArrowLeft size={16} /></button>
                      <button onClick={() => move(d.id, 1)} className="p-2 rounded-lg hover:bg-zinc-800" title="Avanzar"><ArrowRight size={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pedidos({ orders, setOrders, clients }: { orders: Pedido[]; setOrders: (x: Pedido[]) => void; clients: Cliente[] }) {
  const [form, setForm] = useState({ clienteId: clients[0]?.id || '', total: 100000, estado: 'Pendiente' as Pedido['estado'] })
  const add = () => {
    const id = `P-${Math.floor(Math.random() * 900) + 100}`
    setOrders([...orders, { id, clienteId: form.clienteId, total: Number(form.total), estado: form.estado, fecha: new Date().toISOString().slice(0,10) }])
  }
  const remove = (id: string) => setOrders(orders.filter(o => o.id !== id))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <div className="text-xs text-zinc-400">Cliente</div>
          <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}>
            {clients.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
        </div>
        <div>
          <div className="text-xs text-zinc-400">Total</div>
          <input type="number" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm w-36" value={form.total} onChange={e => setForm({ ...form, total: Number(e.target.value) })} />
        </div>
        <div>
          <div className="text-xs text-zinc-400">Estado</div>
          <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as Pedido['estado'] })}>
            {['Pendiente','Facturado','Entregado'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium"><Plus size={16} /> Agregar pedido</button>
      </div>

      <div className="overflow-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950 text-zinc-400"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Fecha</th><th className="text-left p-3">Estado</th><th className="text-left p-3">Total</th><th className="text-left p-3">Acciones</th></tr></thead>
          <tbody>
            {orders.map(o => {
              const c = clients.find(x => x.id === o.clienteId)
              return (
                <tr key={o.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-3">{o.id}</td>
                  <td className="p-3">{c?.nombre}</td>
                  <td className="p-3">{o.fecha}</td>
                  <td className="p-3">{o.estado}</td>
                  <td className="p-3">{currency(o.total)}</td>
                  <td className="p-3"><button onClick={() => remove(o.id)} className="p-2 rounded-lg hover:bg-zinc-800" title="Eliminar"><Trash2 size={16} /></button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tareas({ tasks, setTasks, clients }: { tasks: Tarea[]; setTasks: (x: Tarea[]) => void; clients: Cliente[] }) {
  const [form, setForm] = useState({ clienteId: clients[0]?.id || '', titulo: 'Llamar al cliente', vence: new Date().toISOString().slice(0,16) })
  const add = () => {
    const id = `T-${Math.floor(Math.random() * 90) + 10}`
    setTasks([...tasks, { id, clienteId: form.clienteId, titulo: form.titulo, vence: form.vence, estado: 'Pendiente' }])
  }
  const toggle = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, estado: t.estado === 'Pendiente' ? 'Hecha' : 'Pendiente' } : t))
  const remove = (id: string) => setTasks(tasks.filter(t => t.id !== id))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <div className="text-xs text-zinc-400">Cliente</div>
          <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}>
            {clients.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="text-xs text-zinc-400">Tarea</div>
          <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
        </div>
        <div>
          <div className="text-xs text-zinc-400">Vence</div>
          <input type="datetime-local" className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" value={form.vence} onChange={e => setForm({ ...form, vence: e.target.value })} />
        </div>
        <button onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium"><Plus size={16} /> Agregar</button>
      </div>
      <div className="overflow-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950 text-zinc-400"><tr><th className="text-left p-3">Tarea</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Vence</th><th className="text-left p-3">Estado</th><th className="text-left p-3">Acciones</th></tr></thead>
          <tbody>
            {tasks.map(t => {
              const c = clients.find(x => x.id === t.clienteId)
              return (
                <tr key={t.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-3">{t.titulo}</td>
                  <td className="p-3">{c?.nombre}</td>
                  <td className="p-3">{t.vence.replace('T',' ')}</td>
                  <td className="p-3">{t.estado}</td>
                  <td className="p-3 flex items-center gap-2">
                    <button onClick={() => toggle(t.id)} className="p-2 rounded-lg hover:bg-zinc-800" title="Marcar"><CheckSquare size={16} /></button>
                    <button onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-zinc-800" title="Eliminar"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Reportes({ deals, orders }: { deals: Deal[]; orders: Pedido[] }) {
  const valorEmbudo = STAGES.reduce((acc, s) => {
    const total = deals.filter(d => d.etapa === s).reduce((a, d) => a + (d.valor || 0), 0)
    acc.push({ etapa: s, total }); return acc
  }, [] as Array<{ etapa: string; total: number }>)
  const totalPedidos = orders.reduce((a, o) => a + (o.total || 0), 0)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Valor total en embudo" value={currency(valorEmbudo.reduce((a, x) => a + x.total, 0))} />
        <Stat label="Pedidos totales" value={currency(totalPedidos)} />
        <Stat label="Oportunidades" value={String(deals.length)} />
      </div>
      <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900">
        <div className="font-semibold mb-2">Distribución por etapa</div>
        <ul className="text-sm text-zinc-300 grid grid-cols-1 md:grid-cols-5 gap-2">
          {valorEmbudo.map(v => (
            <li key={v.etapa} className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between">
              <span>{v.etapa}</span>
              <span className="font-medium">{currency(v.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<'inicio'|'clientes'|'inbox'|'embudo'|'pedidos'|'tareas'|'reportes'|'admin'>('inicio')
  const [clients, setClients] = useState<Cliente[]>([])
  const [conversations, setConversations] = useState<Conversacion[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [orders, setOrders] = useState<Pedido[]>([])
  const [tasks, setTasks] = useState<Tarea[]>([])

  // Cargar baseline desde localStorage
  useEffect(() => {
    try {
      const L = <T,>(k: string, d: T) => (JSON.parse(localStorage.getItem(k) || 'null') as T) || d
      setClients(L('crm_clients', defaultClients))
      setConversations(L('crm_conversations', defaultConversations))
      setDeals(L('crm_deals', defaultDeals))
      setOrders(L('crm_orders', defaultOrders))
      setTasks(L('crm_tasks', defaultTasks))
    } catch {}
  }, [])

  // Persistir
  useEffect(() => { try { localStorage.setItem('crm_clients', JSON.stringify(clients)) } catch {} }, [clients])
  useEffect(() => { try { localStorage.setItem('crm_conversations', JSON.stringify(conversations)) } catch {} }, [conversations])
  useEffect(() => { try { localStorage.setItem('crm_deals', JSON.stringify(deals)) } catch {} }, [deals])
  useEffect(() => { try { localStorage.setItem('crm_orders', JSON.stringify(orders)) } catch {} }, [orders])
  useEffect(() => { try { localStorage.setItem('crm_tasks', JSON.stringify(tasks)) } catch {} }, [tasks])

  const NavBtn = ({ id, label, icon: Icon }: { id: typeof tab; label: string; icon: any }) => (
    <button onClick={() => setTab(id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 ${tab === id ? 'bg-zinc-800 text-white' : 'text-zinc-300'}`}>
      <Icon size={18} /> {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 rounded-2xl border border-zinc-800 p-3 bg-zinc-900 h-max sticky top-4">
            <div className="flex items-center gap-2 text-lg font-semibold mb-3"><LayoutDashboard /> CRM LCDM</div>
            <div className="space-y-1">
              <NavBtn id="inicio" label="Inicio" icon={LayoutDashboard} />
              <NavBtn id="clientes" label="Clientes" icon={Users} />
              <NavBtn id="inbox" label="Inbox" icon={MessageSquare} />
              <NavBtn id="embudo" label="Embudo" icon={KanbanSquare} />
              <NavBtn id="pedidos" label="Pedidos" icon={ShoppingCart} />
              <NavBtn id="tareas" label="Tareas" icon={CheckSquare} />
              <NavBtn id="reportes" label="Reportes" icon={BarChart2} />
              <NavBtn id="admin" label="Admin" icon={ServerCog} />
            </div>
            <div className="mt-4 text-xs text-zinc-400">Prototipo. Tus datos de prueba se guardan en tu navegador.</div>
          </aside>

          <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4">
            {tab === 'inicio'   && <Inicio clients={clients} deals={deals} orders={orders} />}
            {tab === 'clientes' && <Clientes clients={clients} setClients={setClients} />}
            {tab === 'inbox'    && <Inbox conversations={conversations} setConversations={setConversations} clients={clients} />}
            {tab === 'embudo'   && <Embudo deals={deals} setDeals={setDeals} clients={clients} />}
            {tab === 'pedidos'  && <Pedidos orders={orders} setOrders={setOrders} clients={clients} />}
            {tab === 'tareas'   && <Tareas tasks={tasks} setTasks={setTasks} clients={clients} />}
            {tab === 'reportes' && <Reportes deals={deals} orders={orders} />}
            {tab === 'admin'    && (
              <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900">
                Panel Admin demo (próximamente conectamos migraciones y scripts de producción)
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

