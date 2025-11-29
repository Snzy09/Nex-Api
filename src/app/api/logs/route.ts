"use server";

import { NextResponse } from "next/server";

async function initFirebase() {
  try {
    const { initializeApp } = await import('firebase/app')
    const { getFirestore } = await import('firebase/firestore')
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    if (!apiKey || !projectId) throw new Error('Firebase not configured')
    const app = initializeApp({
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    })
    const db = getFirestore(app)
    return { db }
  } catch (err) {
    return { db: null }
  }
}

export async function POST(request: Request) {
  const { db } = await initFirebase()

  let body: any
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ status: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const timestamp = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString()
  // detect requester IP from headers if not provided in body
  const headerIp = request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || request.headers.get('fastly-client-ip') || null
  const log: any = {
    timestamp,
    method: body.method || 'GET',
    status: typeof body.status === 'number' ? body.status : null,
    host: body.host || (body.headers && body.headers.host) || null,
    path: body.path || body.url || null,
    ip: body.ip || headerIp || null,
    userAgent: body.userAgent || body.ua || request.headers.get('user-agent') || null,
    responseTimeMs: typeof body.responseTimeMs === 'number' ? body.responseTimeMs : null,
    message: body.message || null,
  }

  // Always append to local file-based logger (best-effort, non-blocking)
  try {
    const { appendLog } = await import('@/lib/filelogger')
    appendLog(log).catch(() => {})
  } catch (e) {
    // ignore
  }

  // Try to persist into Firestore if available, but don't fail the request when Firestore is missing or errors.
  if (db) {
    ;(async () => {
      try {
        const { collection, addDoc } = await import('firebase/firestore')
        const col = collection(db, 'logs')
        await addDoc(col, log)
      } catch (err) {
        // ignore Firestore failures
      }
    })()
  }

  // Return success regardless of Firestore availability. Local appendLog should have recorded the entry.
  return NextResponse.json({ status: true })
}

export async function GET(request: Request) {
  const { db } = await initFirebase()
  if (!db) return NextResponse.json({ status: false, error: 'Firebase not configured' }, { status: 500 })

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const host = url.searchParams.get('host')
    const limit = Number(url.searchParams.get('limit') || '100')
    const before = url.searchParams.get('before')

    const { collection, query, where, orderBy, limit: limitFn, getDocs } = await import('firebase/firestore')
    // Build a simple query; complex combinations require composite indexes
    let q: any
    if (status && host) {
      q = query(collection(db, 'logs'), where('status', '==', Number(status)), where('host', '==', host), orderBy('timestamp', 'desc'), limitFn(limit))
    } else if (status) {
      q = query(collection(db, 'logs'), where('status', '==', Number(status)), orderBy('timestamp', 'desc'), limitFn(limit))
    } else if (host) {
      q = query(collection(db, 'logs'), where('host', '==', host), orderBy('timestamp', 'desc'), limitFn(limit))
    } else {
      q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limitFn(limit))
    }

    if (before) {
      // client can implement pagination via timestamp filtering client-side
    }

    const snap = await getDocs(q)
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ status: true, data })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
