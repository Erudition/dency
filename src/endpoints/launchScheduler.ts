import type { Endpoint } from 'payload'

/**
 * Dev-only endpoint that extracts the JWT from the current admin session cookie
 * and redirects to the frontend scheduler with the token as a URL parameter.
 *
 * GET /api/launch-scheduler
 *
 * This only works in development mode. In production, the frontend and backend
 * share the same origin, so cookie-based auth carries over automatically.
 */
export const launchSchedulerEndpoint: Endpoint = {
  path: '/launch-scheduler',
  method: 'get',
  handler: async (req) => {
    if (process.env.NODE_ENV !== 'development') {
      return Response.json({ error: 'Only available in development mode' }, { status: 403 })
    }

    if (!req.user) {
      return Response.json(
        { error: 'You must be logged in to the admin panel first' },
        { status: 401 },
      )
    }

    // Extract the JWT from the Payload cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const tokenMatch = cookieHeader.match(/payload-token=([^;]+)/)
    const token = tokenMatch ? tokenMatch[1] : null

    if (!token) {
      return Response.json(
        { error: 'Could not extract session token. Please log in again.' },
        { status: 401 },
      )
    }

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173'
    const redirectURL = `${frontendURL}?token=${encodeURIComponent(token)}`

    return Response.redirect(redirectURL, 302)
  },
}
