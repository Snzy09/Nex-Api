'use server'

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { siteConfig } from '@/settings/config'
import { appendLog } from '@/lib/filelogger'

async function githubStalk(username: string) {
  const { data } = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`)
  const hasil = {
    username: data.login,
    nickname: data.name,
    bio: data.bio,
    id: data.id,
    nodeId: data.node_id,
    profile_pic: data.avatar_url,
    url: data.html_url,
    type: data.type,
    admin: data.site_admin,
    company: data.company,
    blog: data.blog,
    location: data.location,
    email: data.email,
    public_repo: data.public_repos,
    public_gists: data.public_gists,
    followers: data.followers,
    following: data.following,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
  return hasil
}

async function handleRequest(req: NextRequest, body?: any) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const username = (body?.username || body?.user || body?.usn) || req.nextUrl.searchParams.get('username') || req.nextUrl.searchParams.get('user') || req.nextUrl.searchParams.get('usn')
  if (!username) {
    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing username' }).catch(() => {})
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'GitHub username (username) parameter is required' }, { status: 400 })
  }

  try {
    const result = await githubStalk(String(username))
    const resp = NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result })
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(() => {})
    return resp
  } catch (err: any) {
    console.error('GitHub Stalk error:', err)
    const statusCode = err?.response?.status || 500
    await appendLog({ method, path: fullPath, status: statusCode, responseTimeMs: Date.now() - start, error: String(err) }).catch(() => {})
    if (statusCode === 404) {
      return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return handleRequest(req, body)
  } catch (err) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 })
  }
}
