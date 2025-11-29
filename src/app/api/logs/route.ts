"use server";

import { NextResponse } from "next/server";

async function initFirebase() {
  try {
    const { initializeApp } = await import('firebase/app')
    const { getFirestore } = await import('firebase/firestore')
    const { getStorage } = await import('firebase/storage')
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
    const storage = getStorage(app)
    return { db, storage }
  } catch (err) {
    return { db: null, storage: null }
  }
}

export async function POST(request: Request) {
  const { db, storage } = await initFirebase()
  if (!db) {
    return NextResponse.json({ status: false, error: 'Firebase not configured' }, { status: 500 })
  }

  let body: any
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ status: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const timestamp = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString()
  const log: any = {
    timestamp,
    method: body.method || 'GET',
    status: typeof body.status === 'number' ? body.status : null,
    host: body.host || (body.headers && body.headers.host) || null,
    path: body.path || body.url || null,
    ip: body.ip || null,
    userAgent: body.userAgent || body.ua || null,
    responseTimeMs: typeof body.responseTimeMs === 'number' ? body.responseTimeMs : null,
    message: body.message || null,
  }

  try {
    const { collection, addDoc } = await import('firebase/firestore')
    // also append to local access log file for dashboard file-based reads
    try {
      const { appendLog } = await import('@/lib/filelogger')
      appendLog(log).catch(() => {})
    } catch (e) {
      // ignore
    }
    let screenshotUrl: string | null = null
    if (body.screenshotBase64 && storage) {
      try {
        const { ref, uploadString, getDownloadURL } = await import('firebase/storage')
        const filename = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2,8)}.png`
        const storageRef = ref(storage, filename)
        // upload the base64 string (assumed raw base64 without data: prefix)
        await uploadString(storageRef, body.screenshotBase64, 'base64')
        screenshotUrl = await getDownloadURL(storageRef)
        log.screenshotUrl = screenshotUrl
      } catch (e) {
        // ignore upload errors but continue
      }
    }

    const col = collection(db, 'logs')
    const docRef = await addDoc(col, log)
    return NextResponse.json({ status: true, id: docRef.id, screenshotUrl: screenshotUrl || null })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: err?.message ?? String(err) }, { status: 500 })
  }
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
