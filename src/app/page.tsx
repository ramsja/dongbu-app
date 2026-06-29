'use client'

import { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  FileText, Plus, Trash2, Save, Edit3, Eye, Users, ChevronDown, ChevronUp,
  UserPlus, Briefcase, ScrollText, Activity, RefreshCw, CheckCircle2, XCircle, Zap,
  AlertTriangle, Rocket, Shield, Clock, Timer, DollarSign, Globe, ExternalLink, Server
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
interface Dependiente {
  nombre: string
  parentesco: string
  contacto: string
}

interface ContratoData {
  id?: number
  nombreTrabajador: string
  dui: string
  edad: string
  sexo: string
  estadoCivil: string
  profesion: string
  domicilio: string
  residencia: string
  nacionalidad: string
  documentoIdentidad: string
  expedidoEn: string
  fechaExpedicion: string
  posicion: string
  proyecto: string
  salario: string
  salarioTexto: string
  duracion: string
  fechaInicio: string
  jornadaLunesViernes: string
  jornadaSabado: string
  nombreEmpresa: string
  apoderado: string
  dependientes: string
  estado: string
}

interface FiniquitoData {
  id?: number
  nombreTrabajador: string
  dui: string
  edad: string
  profesion: string
  nacionalidad: string
  domicilio: string
  posicion: string
  nombreEmpresa: string
  nit: string
  fechaInicio: string
  fechaFin: string
  montoIndemnizacion: string
  montoIndemnizacionTexto: string
  montoVacacion: string
  montoVacacionTexto: string
  montoAguinaldo: string
  montoAguinaldoTexto: string
  montoTotal: string
  testigo1Nombre: string
  testigo1Dui: string
  testigo1Edad: string
  testigo1Profesion: string
  testigo1Domicilio: string
  testigo2Nombre: string
  testigo2Dui: string
  testigo2Edad: string
  testigo2Profesion: string
  testigo2Domicilio: string
  notarioNombre: string
  notarioDomicilio: string
  lugarFecha: string
  hora: string
  estado: string
}

// ============ EMPTY FORMS ============
const emptyContrato: ContratoData = {
  nombreTrabajador: '', dui: '', edad: '', sexo: 'Masculino', estadoCivil: 'Soltero',
  profesion: 'Empleado', domicilio: '', residencia: '', nacionalidad: 'salvadoreña',
  documentoIdentidad: '', expedidoEn: '', fechaExpedicion: '',
  posicion: '', proyecto: '', salario: '', salarioTexto: '',
  duracion: '1 año', fechaInicio: '',
  jornadaLunesViernes: '7:00 a.m. a 12:00 p.m. y de 1:00 p.m. a 3:00 p.m.',
  jornadaSabado: '7:00 a.m. a 11:00 a.m.',
  nombreEmpresa: 'DONGBU CORPORATION, SUCURSAL EL SALVADOR',
  apoderado: 'JUHO IM', dependientes: '[]', estado: 'borrador',
}

const emptyFiniquito: FiniquitoData = {
  nombreTrabajador: '', dui: '', edad: '', profesion: 'Empleado', nacionalidad: 'salvadoreña',
  domicilio: '', posicion: '', nombreEmpresa: 'DONGBU CORPORATION, SUCURSAL EL SALVADOR',
  nit: '9405-240169-101-2', fechaInicio: '', fechaFin: '',
  montoIndemnizacion: '', montoIndemnizacionTexto: '', montoVacacion: '', montoVacacionTexto: '',
  montoAguinaldo: '', montoAguinaldoTexto: '', montoTotal: '',
  testigo1Nombre: '', testigo1Dui: '', testigo1Edad: '', testigo1Profesion: '', testigo1Domicilio: '',
  testigo2Nombre: '', testigo2Dui: '', testigo2Edad: '', testigo2Profesion: '', testigo2Domicilio: '',
  notarioNombre: '', notarioDomicilio: '', lugarFecha: '', hora: '', estado: 'borrador',
}

// ============ FIELD COMPONENT ============
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
      className="text-sm h-9" />
  )
}

// ============ CONTRATO FORM ============
function ContratoForm({ initial, onSave, onCancel }: {
  initial?: ContratoData; onSave: (data: ContratoData) => void; onCancel: () => void
}) {
  const [form, setForm] = useState<ContratoData>(initial || { ...emptyContrato })
  const [deps, setDeps] = useState<Dependiente[]>(
    initial ? JSON.parse(initial.dependientes || '[]') : []
  )

  const set = (field: keyof ContratoData, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const addDep = () => setDeps(prev => [...prev, { nombre: '', parentesco: '', contacto: '' }])
  const removeDep = (i: number) => setDeps(prev => prev.filter((_, idx) => idx !== i))
  const updateDep = (i: number, field: keyof Dependiente, value: string) =>
    setDeps(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))

  const handleSave = () => {
    if (!form.nombreTrabajador.trim() || !form.dui.trim()) {
      toast.error('Nombre y DUI son obligatorios')
      return
    }
    onSave({ ...form, dependientes: JSON.stringify(deps) })
  }

  return (
    <div className="space-y-6">
      {/* Datos Trabajador */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Datos del Trabajador</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Nombre Completo *">
            <FieldInput value={form.nombreTrabajador} onChange={v => set('nombreTrabajador', v)} placeholder="Ej: Efrain Henríquez Abarca" />
          </Field>
          <Field label="DUI *">
            <FieldInput value={form.dui} onChange={v => set('dui', v)} placeholder="Ej: 04767245-8" />
          </Field>
          <Field label="Edad">
            <FieldInput value={form.edad} onChange={v => set('edad', v)} placeholder="Ej: 54" type="number" />
          </Field>
          <Field label="Sexo">
            <Select value={form.sexo} onValueChange={v => set('sexo', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Estado Civil">
            <Select value={form.estadoCivil} onValueChange={v => set('estadoCivil', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Soltero">Soltero</SelectItem><SelectItem value="Casado">Casado</SelectItem>
                <SelectItem value="Divorciado">Divorciado</SelectItem><SelectItem value="Viudo">Viudo</SelectItem>
                <SelectItem value="Union Libre">Unión Libre</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Profesión">
            <FieldInput value={form.profesion} onChange={v => set('profesion', v)} placeholder="Ej: Empleado" />
          </Field>
          <Field label="Domicilio">
            <FieldInput value={form.domicilio} onChange={v => set('domicilio', v)} placeholder="Ej: Ciudad Arce, La Libertad" />
          </Field>
          <Field label="Residencia">
            <FieldInput value={form.residencia} onChange={v => set('residencia', v)} placeholder="Ej: Ciudad Arce, La Libertad" />
          </Field>
          <Field label="Nacionalidad">
            <FieldInput value={form.nacionalidad} onChange={v => set('nacionalidad', v)} />
          </Field>
          <Field label="Documento de Identidad">
            <FieldInput value={form.documentoIdentidad} onChange={v => set('documentoIdentidad', v)} placeholder="DUI o Pasaporte" />
          </Field>
          <Field label="Expedido en">
            <FieldInput value={form.expedidoEn} onChange={v => set('expedidoEn', v)} placeholder="Ej: Santa Tecla, La Libertad" />
          </Field>
          <Field label="Fecha de Expedición">
            <FieldInput value={form.fechaExpedicion} onChange={v => set('fechaExpedicion', v)} placeholder="Ej: 14 de enero de 2025" />
          </Field>
        </div>
      </div>

      {/* Datos Contrato */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Datos del Contrato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Posición *">
            <FieldInput value={form.posicion} onChange={v => set('posicion', v)} placeholder="Ej: Auxiliar de Obra" />
          </Field>
          <Field label="Proyecto">
            <Textarea value={form.proyecto} onChange={e => set('proyecto', e.target.value)} placeholder="Nombre del proyecto" rows={2} className="text-sm" />
          </Field>
          <Field label="Salario ($)">
            <FieldInput value={form.salario} onChange={v => set('salario', v)} placeholder="Ej: 408.80" type="number" />
          </Field>
          <Field label="Salario en texto">
            <FieldInput value={form.salarioTexto} onChange={v => set('salarioTexto', v)} placeholder="Ej: CUATROCIENTOS OCHO DOLARES..." />
          </Field>
          <Field label="Duración">
            <FieldInput value={form.duracion} onChange={v => set('duracion', v)} placeholder="Ej: 1 año" />
          </Field>
          <Field label="Fecha de Inicio">
            <FieldInput value={form.fechaInicio} onChange={v => set('fechaInicio', v)} placeholder="Ej: 2 de junio de 2026" />
          </Field>
          <Field label="Jornada Lun-Vie">
            <FieldInput value={form.jornadaLunesViernes} onChange={v => set('jornadaLunesViernes', v)} />
          </Field>
          <Field label="Jornada Sábado">
            <FieldInput value={form.jornadaSabado} onChange={v => set('jornadaSabado', v)} />
          </Field>
        </div>
      </div>

      {/* Datos Empresa */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Server className="h-4 w-4" /> Datos de la Empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre de la Empresa">
            <FieldInput value={form.nombreEmpresa} onChange={v => set('nombreEmpresa', v)} />
          </Field>
          <Field label="Apoderado">
            <FieldInput value={form.apoderado} onChange={v => set('apoderado', v)} />
          </Field>
        </div>
      </div>

      {/* Dependientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> X.- Personas que dependan económicamente
          </h3>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={addDep}>
            <Plus className="h-3.5 w-3.5" /> Agregar
          </Button>
        </div>
        {deps.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 border border-dashed rounded-lg text-center">
            Sin personas dependientes registradas. Haz clic en &quot;Agregar&quot; para añadir.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_140px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Nombre</span><span>Parentesco</span><span>Número de contacto</span><span></span>
            </div>
            {deps.map((dep, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_140px_40px] gap-2 items-center">
                <Input value={dep.nombre} onChange={e => updateDep(i, 'nombre', e.target.value)} placeholder="Nombre completo" className="h-8 text-sm" />
                <Input value={dep.parentesco} onChange={e => updateDep(i, 'parentesco', e.target.value)} placeholder="Madre" className="h-8 text-sm" />
                <Input value={dep.contacto} onChange={e => updateDep(i, 'contacto', e.target.value)} placeholder="7809-9189" className="h-8 text-sm" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeDep(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Guardar</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

// ============ FINIQUITO FORM ============
function FiniquitoForm({ initial, onSave, onCancel }: {
  initial?: FiniquitoData; onSave: (data: FiniquitoData) => void; onCancel: () => void
}) {
  const [form, setForm] = useState<FiniquitoData>(initial || { ...emptyFiniquito })
  const set = (field: keyof FiniquitoData, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const calcTotal = () => {
    const i = parseFloat(form.montoIndemnizacion) || 0
    const v = parseFloat(form.montoVacacion) || 0
    const a = parseFloat(form.montoAguinaldo) || 0
    set('montoTotal', (i + v + a).toFixed(2))
  }

  const handleSave = () => {
    if (!form.nombreTrabajador.trim() || !form.dui.trim()) {
      toast.error('Nombre y DUI son obligatorios')
      return
    }
    onSave(form)
  }

  return (
    <div className="space-y-6">
      {/* Datos Trabajador */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Datos del Trabajador</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Nombre Completo *">
            <FieldInput value={form.nombreTrabajador} onChange={v => set('nombreTrabajador', v)} placeholder="Ej: Brayan Bladimir Aguirre Aguirre" />
          </Field>
          <Field label="DUI *">
            <FieldInput value={form.dui} onChange={v => set('dui', v)} placeholder="Ej: 07694842-0" />
          </Field>
          <Field label="Edad">
            <FieldInput value={form.edad} onChange={v => set('edad', v)} placeholder="Ej: 19" type="number" />
          </Field>
          <Field label="Profesión">
            <FieldInput value={form.profesion} onChange={v => set('profesion', v)} />
          </Field>
          <Field label="Nacionalidad">
            <FieldInput value={form.nacionalidad} onChange={v => set('nacionalidad', v)} />
          </Field>
          <Field label="Domicilio">
            <FieldInput value={form.domicilio} onChange={v => set('domicilio', v)} placeholder="Ej: Distrito de Colón, La Libertad" />
          </Field>
        </div>
      </div>

      {/* Datos Laborales */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Datos Laborales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Posición">
            <FieldInput value={form.posicion} onChange={v => set('posicion', v)} placeholder="Ej: Auxiliar de Obra" />
          </Field>
          <Field label="Empresa">
            <FieldInput value={form.nombreEmpresa} onChange={v => set('nombreEmpresa', v)} />
          </Field>
          <Field label="NIT">
            <FieldInput value={form.nit} onChange={v => set('nit', v)} />
          </Field>
          <Field label="Fecha de Inicio">
            <FieldInput value={form.fechaInicio} onChange={v => set('fechaInicio', v)} placeholder="Ej: 3 de noviembre de 2025" />
          </Field>
          <Field label="Fecha de Fin (terminación)">
            <FieldInput value={form.fechaFin} onChange={v => set('fechaFin', v)} placeholder="Ej: 12 de junio de 2026" />
          </Field>
        </div>
      </div>

      {/* Montos */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Montos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Indemnización ($)">
            <FieldInput value={form.montoIndemnizacion} onChange={v => { set('montoIndemnizacion', v); setTimeout(calcTotal, 0) }} placeholder="248.64" type="number" />
          </Field>
          <Field label="Indemnización (texto)">
            <FieldInput value={form.montoIndemnizacionTexto} onChange={v => set('montoIndemnizacionTexto', v)} placeholder="DOSCIENTOS CUARENTA Y OCHO..." />
          </Field>
          <Field label="Vacación Proporcional ($)">
            <FieldInput value={form.montoVacacion} onChange={v => { set('montoVacacion', v); setTimeout(calcTotal, 0) }} placeholder="161.62" type="number" />
          </Field>
          <Field label="Vacación Proporcional (texto)">
            <FieldInput value={form.montoVacacionTexto} onChange={v => set('montoVacacionTexto', v)} />
          </Field>
          <Field label="Aguinaldo Proporcional ($)">
            <FieldInput value={form.montoAguinaldo} onChange={v => { set('montoAguinaldo', v); setTimeout(calcTotal, 0) }} placeholder="102.48" type="number" />
          </Field>
          <Field label="Aguinaldo Proporcional (texto)">
            <FieldInput value={form.montoAguinaldoTexto} onChange={v => set('montoAguinaldoTexto', v)} />
          </Field>
          <Field label="TOTAL ($)">
            <Input value={form.montoTotal} readOnly className="h-9 text-sm font-bold bg-muted" />
          </Field>
        </div>
      </div>

      {/* Testigos */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Testigos</h3>
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">Testigo 1</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Nombre"><FieldInput value={form.testigo1Nombre} onChange={v => set('testigo1Nombre', v)} /></Field>
            <Field label="DUI"><FieldInput value={form.testigo1Dui} onChange={v => set('testigo1Dui', v)} /></Field>
            <Field label="Edad"><FieldInput value={form.testigo1Edad} onChange={v => set('testigo1Edad', v)} /></Field>
            <Field label="Profesión"><FieldInput value={form.testigo1Profesion} onChange={v => set('testigo1Profesion', v)} /></Field>
            <Field label="Domicilio"><FieldInput value={form.testigo1Domicilio} onChange={v => set('testigo1Domicilio', v)} /></Field>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Testigo 2</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Nombre"><FieldInput value={form.testigo2Nombre} onChange={v => set('testigo2Nombre', v)} /></Field>
            <Field label="DUI"><FieldInput value={form.testigo2Dui} onChange={v => set('testigo2Dui', v)} /></Field>
            <Field label="Edad"><FieldInput value={form.testigo2Edad} onChange={v => set('testigo2Edad', v)} /></Field>
            <Field label="Profesión"><FieldInput value={form.testigo2Profesion} onChange={v => set('testigo2Profesion', v)} /></Field>
            <Field label="Domicilio"><FieldInput value={form.testigo2Domicilio} onChange={v => set('testigo2Domicilio', v)} /></Field>
          </div>
        </div>
      </div>

      {/* Notario */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ScrollText className="h-4 w-4" /> Notario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Nombre del Notario"><FieldInput value={form.notarioNombre} onChange={v => set('notarioNombre', v)} placeholder="Ej: OSCAR DAVID ANDURAY HERRERA" /></Field>
          <Field label="Domicilio Notario"><FieldInput value={form.notarioDomicilio} onChange={v => set('notarioDomicilio', v)} /></Field>
          <Field label="Lugar y Fecha"><FieldInput value={form.lugarFecha} onChange={v => set('lugarFecha', v)} placeholder="Ej: Distrito de Colón, La Libertad, 23 de junio de 2026" /></Field>
          <Field label="Hora"><FieldInput value={form.hora} onChange={v => set('hora', v)} placeholder="Ej: 10:30" /></Field>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Guardar</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============
export default function Home() {
  const [tab, setTab] = useState('contratos')
  const [contratos, setContratos] = useState<ContratoData[]>([])
  const [finiquitos, setFiniquitos] = useState<FiniquitoData[]>([])
  const [editingContrato, setEditingContrato] = useState<ContratoData | null>(null)
  const [editingFiniquito, setEditingFiniquito] = useState<FiniquitoData | null>(null)
  const [viewingContrato, setViewingContrato] = useState<ContratoData | null>(null)
  const [viewingFiniquito, setViewingFiniquito] = useState<FiniquitoData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchContratos = async () => {
    try {
      const r = await fetch('/api/contratos')
      const d = await r.json()
      setContratos(Array.isArray(d) ? d : [])
    } catch { setContratos([]) }
  }

  const fetchFiniquitos = async () => {
    try {
      const r = await fetch('/api/finiquitos')
      const d = await r.json()
      setFiniquitos(Array.isArray(d) ? d : [])
    } catch { setFiniquitos([]) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchContratos()
    fetchFiniquitos()
  }, [])

  const saveContrato = async (data: ContratoData) => {
    setLoading(true)
    try {
      if (data.id) {
        await fetch(`/api/contratos/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        toast.success('Contrato actualizado')
      } else {
        await fetch('/api/contratos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        toast.success('Contrato creado')
      }
      setDialogOpen(false); setEditingContrato(null)
      fetchContratos()
    } catch { toast.error('Error al guardar') }
    setLoading(false)
  }

  const saveFiniquito = async (data: FiniquitoData) => {
    setLoading(true)
    try {
      if (data.id) {
        await fetch(`/api/finiquitos/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        toast.success('Finiquito actualizado')
      } else {
        await fetch('/api/finiquitos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        toast.success('Finiquito creado')
      }
      setDialogOpen(false); setEditingFiniquito(null)
      fetchFiniquitos()
    } catch { toast.error('Error al guardar') }
    setLoading(false)
  }

  const deleteContrato = async (id: number) => {
    if (!confirm('¿Eliminar este contrato?')) return
    await fetch(`/api/contratos/${id}`, { method: 'DELETE' })
    toast.success('Contrato eliminado')
    fetchContratos()
  }

  const deleteFiniquito = async (id: number) => {
    if (!confirm('¿Eliminar este finiquito?')) return
    await fetch(`/api/finiquitos/${id}`, { method: 'DELETE' })
    toast.success('Finiquito eliminado')
    fetchFiniquitos()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">DONGBU - RRHH</h1>
              <p className="text-[11px] text-muted-foreground">Contrataciones y Finiquitos</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">{contratos.length} contratos · {finiquitos.length} finiquitos</Badge>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="contratos" className="gap-1.5 text-sm"><Briefcase className="h-4 w-4" /> Contratos</TabsTrigger>
              <TabsTrigger value="finiquitos" className="gap-1.5 text-sm"><ScrollText className="h-4 w-4" /> Finiquitos</TabsTrigger>
            </TabsList>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5" onClick={() => {
                  if (tab === 'contratos') setEditingContrato({ ...emptyContrato })
                  else setEditingFiniquito({ ...emptyFiniquito })
                }}>
                  <Plus className="h-4 w-4" /> Nuevo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {tab === 'contratos'
                      ? (editingContrato?.id ? 'Editar Contrato' : 'Nuevo Contrato')
                      : (editingFiniquito?.id ? 'Editar Finiquito' : 'Nuevo Finiquito')}
                  </DialogTitle>
                </DialogHeader>
                {tab === 'contratos' && editingContrato && (
                  <ContratoForm
                    initial={editingContrato}
                    onSave={saveContrato}
                    onCancel={() => { setDialogOpen(false); setEditingContrato(null) }}
                  />
                )}
                {tab === 'finiquitos' && editingFiniquito && (
                  <FiniquitoForm
                    initial={editingFiniquito}
                    onSave={saveFiniquito}
                    onCancel={() => { setDialogOpen(false); setEditingFiniquito(null) }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* CONTRATOS TAB */}
          <TabsContent value="contratos" className="space-y-4">
            {contratos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Sin contratos registrados</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Haz clic en &quot;Nuevo&quot; para crear tu primer contrato</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {contratos.map(c => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{c.nombreTrabajador}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>DUI: {c.dui}</span>
                            {c.posicion && <span>· {c.posicion}</span>}
                            {c.fechaInicio && <span>· Desde: {c.fechaInicio}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={c.estado === 'activo' ? 'default' : 'secondary'} className="text-[10px]">
                            {c.estado}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setViewingContrato(c)
                          }}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingContrato(c); setDialogOpen(true)
                          }}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteContrato(c.id!)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FINIQUITOS TAB */}
          <TabsContent value="finiquitos" className="space-y-4">
            {finiquitos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <ScrollText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Sin finiquitos registrados</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Haz clic en &quot;Nuevo&quot; para crear tu primer finiquito</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {finiquitos.map(f => (
                  <Card key={f.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{f.nombreTrabajador}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>DUI: {f.dui}</span>
                            {f.posicion && <span>· {f.posicion}</span>}
                            {f.fechaFin && <span>· Fin: {f.fechaFin}</span>}
                            {f.montoTotal && <span className="font-medium text-foreground">· ${f.montoTotal}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={f.estado === 'firmado' ? 'default' : 'secondary'} className="text-[10px]">
                            {f.estado}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingFiniquito(f); setDialogOpen(true)
                          }}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteFiniquito(f.id!)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Contrato Detail */}
        <Dialog open={!!viewingContrato} onOpenChange={() => setViewingContrato(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Detalle del Contrato</DialogTitle></DialogHeader>
            {viewingContrato && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-xs">Nombre:</span><p className="font-medium">{viewingContrato.nombreTrabajador}</p></div>
                  <div><span className="text-muted-foreground text-xs">DUI:</span><p className="font-medium">{viewingContrato.dui}</p></div>
                  <div><span className="text-muted-foreground text-xs">Posición:</span><p className="font-medium">{viewingContrato.posicion}</p></div>
                  <div><span className="text-muted-foreground text-xs">Salario:</span><p className="font-medium">${viewingContrato.salario}</p></div>
                  <div><span className="text-muted-foreground text-xs">Fecha Inicio:</span><p className="font-medium">{viewingContrato.fechaInicio}</p></div>
                  <div><span className="text-muted-foreground text-xs">Duración:</span><p className="font-medium">{viewingContrato.duracion}</p></div>
                </div>
                {viewingContrato.dependientes && viewingContrato.dependientes !== '[]' && (
                  <div>
                    <p className="font-medium mb-2">Personas que dependen económicamente:</p>
                    <Table>
                      <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Parentesco</TableHead><TableHead>Contacto</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {JSON.parse(viewingContrato.dependientes).map((d: Dependiente, i: number) => (
                          <TableRow key={i}><TableCell>{d.nombre}</TableCell><TableCell>{d.parentesco}</TableCell><TableCell>{d.contacto}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <footer className="border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          DONGBU CORPORATION - Sistema de Contrataciones y Finiquitos
        </div>
      </footer>
    </div>
  )
}
