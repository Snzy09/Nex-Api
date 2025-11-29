"use server";

import { NextResponse } from 'next/server'

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

export async function GET() {
  const { db } = await initFirebase()
  if (!db) return NextResponse.json({ status: false, error: 'Firebase not configured' }, { status: 500 })

  // SSE stream via Firestore onSnapshot (best-effort). Note: long-lived server-side listeners
  // may not be supported in all hosting environments. For production consider client-side onSnapshot
  // or a dedicated logging pipeline.
  const { collection, query, orderBy, limit: limitFn, onSnapshot } = await import('firebase/firestore')

  const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limitFn(100))

  const stream = new ReadableStream({
    start(controller) {
      let unsub: any = null
      try {
        unsub = onSnapshot(q, (snap: any) => {
          snap.docChanges().forEach((change: any) => {
            if (change.type === 'added' || change.type === 'modified') {
              const payload = JSON.stringify({ id: change.doc.id, ...change.doc.data() })
              controller.enqueue(`data: ${payload}\n\n`)
            }
          })
        }, (err: any) => {
          controller.enqueue(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`)
        })
      } catch (e) {
        controller.enqueue(`event: error\ndata: ${JSON.stringify({ error: 'Failed to subscribe to logs' })}\n\n`)
        controller.close()
      }

      controller.enqueue('data: [connected]\n\n')

      // teardown
      controller.signal.addEventListener('abort', () => {
        if (unsub) unsub()
      })
    }
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}
