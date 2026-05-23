import type { Endpoint } from 'payload'

/**
 * Endpoint that extracts the JWT from the current admin session cookie
 * and redirects to the frontend scheduler with the token as a URL parameter.
 *
 * GET /api/launch-scheduler
 *
 * The admin user must be logged in. The extracted token is passed as a
 * query parameter so the cross-origin frontend can authenticate.
 */
export const launchSchedulerEndpoint: Endpoint = {
  path: '/launch-scheduler',
  method: 'get',
  handler: async (req) => {
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

    const frontendURL =
      process.env.FRONTEND_URL || 'https://erudition.github.io/Residency-Optimizer'
    const redirectURL = `${frontendURL}?token=${encodeURIComponent(token)}`

    return Response.redirect(redirectURL, 302)
  },
}
