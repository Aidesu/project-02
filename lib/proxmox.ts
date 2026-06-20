import 'server-only'
import http from 'node:http'
import https from 'node:https'
import type { ProxmoxStats, Server } from './types'

// Reads CPU/RAM/uptime of a VM or container from the Proxmox VE API.
//
// Required env vars (see .env.example):
//   PROXMOX_URL          e.g. https://192.168.1.10:8006
//   PROXMOX_TOKEN        "USER@REALM!TOKENID=SECRET"
//   PROXMOX_INSECURE_TLS "true" to accept Proxmox's self-signed certificate
//
// Uses node:https directly so the self-signed certificate can be accepted per
// request (via a scoped Agent) without disabling TLS verification globally.
// Never throws: any failure resolves to `{ available: false, error }`.

let insecureAgent: https.Agent | undefined

function getInsecureAgent(): https.Agent {
  insecureAgent ??= new https.Agent({ rejectUnauthorized: false, keepAlive: true })
  return insecureAgent
}

function fetchJson(
  urlStr: string,
  token: string,
  insecure: boolean,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const isHttps = url.protocol === 'https:'
    const mod = isHttps ? https : http
    const agent = isHttps && insecure ? getInsecureAgent() : undefined

    const req = mod.request(
      url,
      { method: 'GET', headers: { Authorization: `PVEAPIToken=${token}` }, agent, timeout: timeoutMs },
      (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
      },
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('Délai dépassé (Proxmox)')))
    req.end()
  })
}

export async function queryProxmox(server: Server): Promise<ProxmoxStats> {
  const ref = server.proxmox
  if (!ref) return { available: false, error: 'Aucune référence Proxmox configurée' }
  if (ref.type !== 'lxc' && ref.type !== 'qemu') {
    return { available: false, error: `Type Proxmox invalide : ${ref.type}` }
  }

  const base = process.env.PROXMOX_URL?.replace(/\/$/, '')
  const token = process.env.PROXMOX_TOKEN
  if (!base || !token) {
    return { available: false, error: 'PROXMOX_URL / PROXMOX_TOKEN non configurés' }
  }

  // Encode each path segment — `node` comes from admin-managed data and must
  // not be able to alter the request path.
  const node = encodeURIComponent(ref.node)
  const vmid = encodeURIComponent(String(ref.vmid))
  const url = `${base}/api2/json/nodes/${node}/${ref.type}/${vmid}/status/current`
  const insecure = process.env.PROXMOX_INSECURE_TLS === 'true'

  try {
    const { status, body } = await fetchJson(url, token, insecure, 5000)
    if (status < 200 || status >= 300) {
      return { available: false, error: `Proxmox a répondu ${status}` }
    }

    const json = JSON.parse(body) as { data?: Record<string, unknown> }
    const d = json.data ?? {}
    const num = (v: unknown) => (typeof v === 'number' ? v : undefined)

    return {
      available: true,
      status: typeof d.status === 'string' ? d.status : undefined,
      cpu: num(d.cpu),
      cpus: num(d.cpus),
      mem: num(d.mem),
      maxmem: num(d.maxmem),
      uptime: num(d.uptime),
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion à Proxmox',
    }
  }
}
