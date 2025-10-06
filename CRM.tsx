// eslint-disable-next-line @typescript-eslint/no-explicit-any
import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Users, LayoutDashboard, KanbanSquare, ShoppingCart, CheckSquare, BarChart2, Plus, Send, Search, Tag, Phone, Mail, Upload, ArrowRight, ArrowLeft, Trash2, X, ServerCog } from "lucide-react";

const currency = (n: number) => Number(n || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow"><div className="text-zinc-400 text-sm">{label}</div><div className="text-2xl font-semibold mt-1">{value}</div>{hint && <div className="text-xs text-zinc-500 mt-1">{hint}</div>}</div>);
}
function Badge({ children }: { children: React.ReactNode }) { return (<span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700"><Tag size={12} /> {children}</span>); }
const STAGES = ["Nuevo","Contactado","Cotizado","Pagado","Entregado"] as const;

const defaultClients = [
  { id: "C-001", nombre: "Juan Pérez", telefono: "+57 300 123 4567", email: "juan@example.com", etiquetas: ["Recurrente","WhatsApp"], totalPedidos: 6, nota: "", ultimoContacto: "2025-10-02" },
  { id: "C-002", nombre: "Ferretería El Martillo", telefono: "+57 310 555 9911", email: "compras@martillo.com", etiquetas: ["Mayorista"], totalPedidos: 11, nota: "", ultimoContacto: "2025-10-04" },
  { id: "C-003", nombre: "Lina Gómez", telefono: "+57 312 222 1111", email: "lina@example.com", etiquetas: ["Instagram"], totalPedidos: 2, nota: "", ultimoContacto: "2025-10-03" },
];
const defaultConversations = [
  { id: "W-1001", clienteId: "C-001", canal: "WhatsApp", abierto: true, mensajes: [{ id:1, dir:"IN", texto:"Hola, ¿tienen chaqueta impermeable talla M?", ts:"2025-10-02 08:21" },{ id:2, dir:"OUT", texto:"¡Hola Juan! Sí, tenemos dos modelos. ¿prefieres negra o reflectiva?", ts:"2025-10-02 08:23" }]},
  { id: "W-1002", clienteId: "C-002", canal: "WhatsApp", abierto: true, mensajes: [{ id:1, dir:"IN", texto:"Coticemos 10 intercomunicadores", ts:"2025-10-04 10:12" },{ id:2, dir:"OUT", texto:"Claro, te paso la proforma en un momento.", ts:"2025-10-04 10:14" }]},
];
const defaultDeals = [
  { id:"O-001", clienteId:"C-001", titulo:"Chaqueta impermeable M", valor:130000, etapa:"Nuevo" as typeof STAGES[number] },
  { id:"O-002", clienteId:"C-002", titulo:"10 intercomunicadores", valor:2800000, etapa:"Cotizado" as typeof STAGES[number] },
  { id:"O-003", clienteId:"C-003", titulo:"Rodilleras + Guantes", valor:240000, etapa:"Contactado" as typeof STAGES[number] },
];
const defaultOrders = [
  { id:"P-100", clienteId:"C-001", total:130000, estado:"Pendiente", fecha:"2025-10-02" },
  { id:"P-101", clienteId:"C-002", total:2800000, estado:"Facturado", fecha:"2025-10-04" },
];
const defaultTasks = [
  { id:"T-01", clienteId:"C-002", titulo:"Enviar proforma 10 intercomunicadores", vence:"2025-10-05 15:00", estado:"Pendiente" },
  { id:"T-02", clienteId:"C-001", titulo:"Confirmar talla y color", vence:"2025-10-05 11:30", estado:"Pendiente" },
];

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60" onClick={onClose} />
    <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="text-sm font-semibold text-zinc-200">{title}</div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800"><X size={16} /></button>
      </div>
      <div className="p-4">{children}</div>
      {footer && <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">{footer}</div>}
    </div>
  </div>);
}

function Inicio({ clients, deals, orders }: any) {
  const totalHoy = orders.reduce((a: number, o: any) => a + (o.total || 0), 0);
  const abiertas = deals.filter((d: any) => d.etapa !== "Entregado").length;
  const nuevos = deals.filter((d: any) => d.etapa === "Nuevo").length;
  return (<div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Stat label="Pedidos del periodo" value={currency(totalHoy)} hint="Suma de pedidos registrados" />
      <Stat label="Oportunidades abiertas" value={String(abiertas)} hint="Aún en proceso" />
      <Stat label="Oportunidades nuevas" value={String(nuevos)} hint="Entrada reciente" />
      <Stat label="Clientes" value={String(clients.length)} hint="Activos en CRM" />
    </div>
    <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900">
      <div className="text-zinc-300">Bienvenido al CRM de LCDM. Usa el menú para navegar.</div>
    </div>
  </div>);
}

# ... (rest of components are long; to keep build minimal we'll import CRM only)
