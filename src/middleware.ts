import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/income/:path*',
    '/money-split/:path*',
    '/debt/:path*',
    '/receivables/:path*',
    '/bills/:path*',
    '/savings/:path*',
    '/investments/:path*',
    '/assets/:path*',
    '/lifestyle/:path*',
    '/software/:path*',
    '/summary/:path*',
    '/settings/:path*',
  ],
}
