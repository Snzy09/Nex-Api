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
  // Stream logs from local file/memory via filelogger
  const { tailLogs, subscribeLogs } = await import('@/lib/filelogger')

  const initial = tailLogs(100)

  const stream = new ReadableStream({
    start(controller) {
      // send initial batch
      try {
        controller.enqueue(`data: ${JSON.stringify({ type: 'initial', items: initial })}\n\n`)
      } catch (e) {
        // ignore
      }

      const unsubscribe = subscribeLogs((entry: any) => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'add', item: entry })}\n\n`)
        } catch (e) {
          // ignore
        }
      })

      controller.signal.addEventListener('abort', () => {
        unsubscribe()
      })
    }
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}
