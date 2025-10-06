/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect } from "react";
import { LayoutDashboard, Users, Plus, Search, Tag, Phone, Mail, Upload, Trash2, X } from "lucide-react";

function Badge({ children }: { children: React.ReactNode }) {
  return (<span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700"><Tag size={12}/>{children}</span>);
}

function Modal({ open, onClose, title, children, footer }:{
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode; footer?:React.ReactNode
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="text-sm font-semibold text-zinc-200">{title}</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800"><X size={16}/></button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

const defaultClients = [
  { id:"C-001", nombre:"Juan Pérez", telefono:"+57 300 123 4567", email:"juan@example.com", etiquetas:["Recurrente","WhatsApp"], totalPedidos:6, nota:"" },
  { id:"C-002", nombre:"Ferretería El Martillo", telefono:"+57 310 555 9911", email:"compras@martillo.com", etiquetas:["Mayorista"], totalPedidos:11, nota:"" },
  { id:"C-003", nombre:"Lina Gómez", telefono:"+57 312 222 1111", email:"lina@example.com", etiquetas:["Instagram"], totalPedidos:2, nota:"" },
];

function Clientes({ clients, setClients }:{clients:any[]; setClients:(x:any)=>void}) {
  const [q,setQ]=useState(""); const [open,setOpen]=useState(false);
  const [form,setForm]=useState({nombre:"",telefono:"",email:""});
  const filtered = useMemo(()=> {
    const s=q.toLowerCase();
    return clients.filter((c:any)=>[c.nombre,c.telefono,c.email].some((v:string)=>String(v||"").toLowerCase().includes(s)));
  },[q,clients]);

  const add = ()=>{
    if(!form.nombre.trim()||!form.telefono.trim()) return;
    const id=`C-${Math.floor(Math.random()*900)+100}`;
    setClients([...clients,{ id, nombre:form.nombre.trim(), telefono:form.telefono.trim(), email:form.email.trim(), etiquetas:["WhatsApp"], totalPedidos:0, nota:"" }]);
    setForm({nombre:"",telefono:"",email:""}); setOpen(false);
  };
  const remove=(id:string)=> setClients(clients.filter((c:any)=>c.id!==id));
  const onUploadTxt = async (e:any, id:string)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const text=await file.text();
    setClients(clients.map((c:any)=> c.id===id?{...c, nota:(c.nota||"")+`\n\n--- HISTORIAL IMPORTADO (${file.name}) ---\n`+text}:c));
    e.target.value="";
  };

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setOpen(false); if(e.key==='Enter' && open) add(); };
    window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey);
  },[open,form]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
          <Search size={16} className="text-zinc-500"/>
          <input className="bg-transparent outline-none text-sm" placeholder="Buscar clientes" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div className="ml-auto">
          <button onClick={()=>setOpen(true)} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium flex items-center gap-2"><Plus size={16}/> Agregar</button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950 text-zinc-400"><tr>
            <th className="text-left p-3">Cliente</th>
            <th className="text-left p-3">Teléfono</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Etiquetas</th>
            <th className="text-left p-3">Pedidos</th>
            <th className="text-left p-3">Nota / Historial</th>
            <th className="text-left p-3">Acciones</th>
          </tr></thead>
          <tbody>
            {filtered.map((c:any)=>(
              <tr key={c.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                <td className="p-3 font-medium text-zinc-200">{c.nombre}</td>
                <td className="p-3"><div className="flex items-center gap-2 text-zinc-300"><Phone size={14}/>{c.telefono}</div></td>
                <td className="p-3"><div className="flex items-center gap-2 text-zinc-300"><Mail size={14}/>{c.email || "—"}</div></td>
                <td className="p-3 flex flex-wrap gap-1">{(c.etiquetas||[]).map((e:string,i:number)=><Badge key={i}>{e}</Badge>)}</td>
                <td className="p-3">{c.totalPedidos||0}</td>
                <td className="p-3 max-w-[280px]"><div className="text-xs text-zinc-300 whitespace-pre-wrap line-clamp-3">{c.nota||"—"}</div></td>
                <td className="p-3 flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <Upload size={14}/><span>Importar .txt</span>
                    <input type="file" accept=".txt" className="hidden" onChange={(e)=>onUploadTxt(e,c.id)}/>
                  </label>
                  <button onClick={()=>remove(c.id)} className="p-2 rounded-lg hover:bg-zinc-800" title="Eliminar"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="Nuevo cliente"
        footer={<>
          <button onClick={()=>setOpen(false)} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm">Cancelar</button>
          <button onClick={add} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium">Guardar</button>
        </>}>
        <div className="space-y-3">
          <div><div className="text-xs text-zinc-400 mb-1">Nombre *</div>
            <input autoFocus className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" placeholder="Ej. Juan Pérez" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/></div>
          <div><div className="text-xs text-zinc-400 mb-1">Teléfono *</div>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" placeholder="Ej. +57 300 000 0000" value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})}/></div>
          <div><div className="text-xs text-zinc-400 mb-1">Email</div>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm" placeholder="correo@dominio.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/></div>
          <div className="text-xs text-zinc-500">Los campos marcados con * son obligatorios.</div>
        </div>
      </Modal>
    </div>
  );
}

export default function CRM(){
  const [tab,setTab]=useState<"inicio"|"clientes">("clientes");
  const [clients,setClients]=useState<any[]>([]);
  useEffect(()=>{ setClients(defaultClients); },[]);
  const NavBtn=({id,label,icon:Icon}:{id:"inicio"|"clientes";label:string;icon:any})=>(
    <button onClick={()=>setTab(id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 ${tab===id?"bg-zinc-800 text-white":"text-zinc-300"}`}>
      <Icon size={18}/> {label}
    </button>
  );
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 rounded-2xl border border-zinc-800 p-3 bg-zinc-900 h-max sticky top-4">
            <div className="flex items-center gap-2 text-lg font-semibold mb-3"><LayoutDashboard/> CRM LCDM</div>
            <div className="space-y-1">
              <NavBtn id="inicio" label="Inicio" icon={LayoutDashboard}/>
              <NavBtn id="clientes" label="Clientes" icon={Users}/>
            </div>
            <div className="mt-4 text-xs text-zinc-400">Prototipo. Datos de prueba en tu navegador.</div>
          </aside>
          <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4">
            {tab==="clientes" ? <Clientes clients={clients} setClients={setClients}/> : <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900">Inicio</div>}
          </main>
        </div>
      </div>
    </div>
  );
}
