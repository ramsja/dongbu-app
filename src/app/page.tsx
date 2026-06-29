'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity, Zap, Clock, DollarSign, Server, ExternalLink,
  Copy, Check, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Globe,
  Rocket, Shield, Timer
} from 'lucide-react'
import { toast } from 'sonner'

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} copiado al portapapeles`)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  )
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg bg-zinc-950 text-zinc-100 p-4 text-sm font-mono overflow-x-auto">
      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] uppercase tracking-wider">{language}</Badge>
      <pre className="whitespace-pre-wrap leading-relaxed"><code>{code}</code></pre>
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
      {n}
    </div>
  )
}

interface BotStatus {
  online: boolean | null
  ms?: number
  ts?: string
  checking: boolean
}

const BOT_URL = 'https://dongbu-whatsapp-bot.onrender.com/'

export default function Home() {
  const [status, setStatus] = useState<BotStatus>({ online: null, checking: false })
  const [customUrl, setCustomUrl] = useState(BOT_URL)

  const checkBot = useCallback(async (url?: string) => {
    const target = url || customUrl
    if (!target) return
    setStatus(prev => ({ ...prev, checking: true }))
    try {
      const res = await fetch(`/api/bot-status?url=${encodeURIComponent(target)}`)
      const data = await res.json()
      setStatus({ online: data.online, ms: data.ms, ts: data.ts, checking: false })
    } catch {
      setStatus({ online: false, checking: false })
    }
  }, [customUrl])

  useEffect(() => { checkBot(BOT_URL) }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-zinc-50">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Bot 24/7 en Render</h1>
            <p className="text-xs text-muted-foreground">Guia para mantener tu WhatsApp bot siempre activo</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Diagnostico Rapido */}
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Diagnostico Rapido
            </CardTitle>
            <CardDescription>Verifica si tu bot esta online ahora mismo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://tu-bot.onrender.com"
                className="font-mono text-sm"
              />
              <Button
                onClick={() => checkBot()}
                disabled={status.checking}
                className="gap-2 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${status.checking ? 'animate-spin' : ''}`} />
                Verificar
              </Button>
            </div>
            {status.online !== null && !status.checking && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                status.online
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}>
                {status.online
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <XCircle className="h-5 w-5" />
                }
                <span className="text-sm font-medium">
                  {status.online
                    ? `Bot ONLINE - Respondio en ${status.ms}ms`
                    : 'Bot OFFLINE - No responde (probablemente dormido)'
                  }
                </span>
                {status.ts && (
                  <span className="text-xs opacity-70 ml-auto">
                    {new Date(status.ts).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* El Problema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Por que tu bot se cae?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              En el <strong>plan gratuito de Render</strong>, tu servicio web se <strong>"duerme" despues de 15 minutos sin trafico</strong>.
              Cuando llega un mensaje de WhatsApp, Render tiene que despertar el servicio, lo cual puede tardar <strong>30-60 segundos</strong>.
              Si el webhook de WhatsApp no recibe respuesta rapida, el mensaje se pierde.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div><p className="font-medium text-foreground text-xs">15 min</p><p className="text-xs">Sin trafico = se duerme</p></div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Timer className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div><p className="font-medium text-foreground text-xs">30-60 seg</p><p className="text-xs">Para despertar</p></div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <XCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div><p className="font-medium text-foreground text-xs">Mensajes perdidos</p><p className="text-xs">WhatsApp da timeout</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soluciones - Tabs */}
        <Tabs defaultValue="uptimerobot" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold">Soluciones para mantenerlo 24/7</h2>
          </div>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="uptimerobot" className="text-xs sm:text-sm py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              UptimeRobot (Gratis)
            </TabsTrigger>
            <TabsTrigger value="cron-job" className="text-xs sm:text-sm py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Cron-job.org (Gratis)
            </TabsTrigger>
            <TabsTrigger value="koyeb" className="text-xs sm:text-sm py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Migrar a Koyeb
            </TabsTrigger>
            <TabsTrigger value="paid" className="text-xs sm:text-sm py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Render Pago
            </TabsTrigger>
          </TabsList>

          {/* === SOLUCION 1: UptimeRobot === */}
          <TabsContent value="uptimerobot">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">UptimeRobot</CardTitle>
                      <CardDescription>La opcion mas facil - 100% gratis</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-100">
                    RECOMENDADA
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  UptimeRobot hace un <strong>ping a tu bot cada 5 minutos</strong>, asi Render nunca lo duerme. Es gratis, no necesitas tarjeta de credito.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <StepNumber n={1} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crea una cuenta en UptimeRobot</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <a href="https://uptimerobot.com" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" /> uptimerobot.com
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={2} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Agrega un nuevo monitor</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Dashboard &rarr; Add New Monitor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={3} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Configura asi:</p>
                      <div className="mt-2 space-y-1.5 text-sm">
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">Monitor Type:</span><Badge variant="secondary">HTTP(s)</Badge></div>
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">URL:</span><code className="bg-muted px-2 py-0.5 rounded text-xs">https://dongbu-whatsapp-bot.onrender.com/</code></div>
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">Interval:</span><Badge variant="secondary">5 minutos</Badge></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={4} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Guarda y listo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Tu bot ahora recibira un ping cada 5 minutos y nunca se dormira.</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Tip: Tambien puedes configurar alertas por email/Telegram/Discord si el bot se cae de verdad.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SOLUCION 2: Cron-job.org === */}
          <TabsContent value="cron-job">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Cron-job.org</CardTitle>
                    <CardDescription>Alternativa gratuita con mas control</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Servicio gratuito que te permite programar pings HTTP a intervalos personalizados.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <StepNumber n={1} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crea tu cuenta</p>
                      <a href="https://cron-job.org/en/signup/" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 mt-1.5">
                          <ExternalLink className="h-3.5 w-3.5" /> cron-job.org
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={2} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crea un cronjob</p>
                      <div className="mt-2 space-y-1.5 text-sm">
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">Title:</span><code className="bg-muted px-2 py-0.5 rounded text-xs">Keep WhatsApp Bot Alive</code></div>
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">URL:</span><code className="bg-muted px-2 py-0.5 rounded text-xs">https://dongbu-whatsapp-bot.onrender.com/</code></div>
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">Schedule:</span><Badge variant="secondary">Every 5 minutes</Badge></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={3} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Activa el job y listo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SOLUCION 3: Koyeb === */}
          <TabsContent value="koyeb">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Migrar a Koyeb</CardTitle>
                    <CardDescription>Instancia gratis que NO se duerme</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Koyeb ofrece una <strong>instancia gratuita "nano" que nunca se duerme</strong>. Es la mejor alternativa si no quieres pagar.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs font-medium text-emerald-600">Koyeb (Gratis)</p>
                    <p className="text-xs text-muted-foreground">512MB RAM, 0.1 vCPU, nunca duerme</p>
                  </div>
                  <div className="p-3 rounded-lg border space-y-1">
                    <p className="text-xs font-medium text-amber-600">Render (Gratis)</p>
                    <p className="text-xs text-muted-foreground">512MB RAM, se duerme a los 15 min</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <StepNumber n={1} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crea cuenta en Koyeb</p>
                      <a href="https://app.koyeb.com/signup" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 mt-1.5">
                          <ExternalLink className="h-3.5 w-3.5" /> koyeb.com
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={2} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Despliega desde tu repo de GitHub</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Conecta tu repo y selecciona la instancia &quot;Nano&quot; (gratis)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={3} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Configura las variables de entorno</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Mueve tus env vars de Render a Koyeb</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepNumber n={4} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Actualiza el webhook de WhatsApp</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Cambia la URL en tu proveedor de WhatsApp a la nueva URL de Koyeb</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                  <p className="text-xs font-medium text-sky-700 dark:text-sky-300">
                    Koyeb es la mejor opcion gratuita para bots 24/7. No necesitas UptimeRobot ni nada extra.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SOLUCION 4: Pago === */}
          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Render Pago</CardTitle>
                    <CardDescription>Si prefieres quedarte en Render</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El plan pago de Render <strong>no duerme nunca</strong> y tiene mas recursos. Empieza en <strong>$7/mes</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg border text-center space-y-2">
                    <p className="text-2xl font-bold">$7</p>
                    <p className="text-xs text-muted-foreground">/mes - Starter</p>
                    <div className="space-y-1 text-xs text-left">
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Nunca se duerme</p>
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 512MB RAM</p>
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Auto deploy desde Git</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border text-center space-y-2">
                    <p className="text-2xl font-bold">$0</p>
                    <p className="text-xs text-muted-foreground">/mes + UptimeRobot</p>
                    <div className="space-y-1 text-xs text-left">
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Se mantiene despierto</p>
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 512MB RAM</p>
                      <p className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> 750 horas/mes limite</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    El plan gratis de Render tiene un limite de 750 horas/mes. Con UptimeRobot haces pings cada 5 min = ~288 pings/dia. Eso gasta ~3.6 horas extra al dia, todavia estas dentro del limite mensual.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resumen rapido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Que hacer AHORA (resumen rapido)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Opcion 1 - Rapida y gratis (5 minutos)</p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                    Registrate en <strong>UptimeRobot.com</strong> y agrega un monitor HTTP a <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">https://dongbu-whatsapp-bot.onrender.com/</code> cada 5 minutos. Listo, tu bot nunca mas se dormira.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                <Globe className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">Opcion 2 - Mejor a largo plazo (30 minutos)</p>
                  <p className="text-xs text-sky-700/80 dark:text-sky-400 mt-0.5">
                    Migra tu bot a <strong>Koyeb</strong>. La instancia gratuita nano <strong>nunca se duerme</strong>, no necesitas ping ni servicios extra. Conecta tu GitHub y despliega.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Guia para mantener tu WhatsApp Bot 24/7 en Render
        </div>
      </footer>
    </div>
  )
}
