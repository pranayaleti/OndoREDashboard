import { Link, Navigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Loading from "@/components/loading"
import { MuralVignette } from "@/components/art/ondo-mural"
import { useAuth } from "@/lib/auth-context"
import { getReferralsPath } from "@/lib/auth-utils"

/**
 * /referrals: the address the marketing site and emails link to. The referral program itself
 * lives inside each portal (/owner/referrals, /tenant/rewards#refer, ...), so signed-in users go
 * straight to theirs and everyone else gets a short explanation with a way in.
 */
export default function Referrals() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Loading />
  if (user) return <Navigate to={getReferralsPath(user.role)} replace />

  return (
    <section className="container mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <MuralVignette className="mb-6" />
      <h1 className="text-3xl font-bold text-foreground">Ondo referral program</h1>
      <p className="mt-3 text-foreground/80">
        Ondo rents out its own homes in Utah. Tenants earn Ondo Rewards points when a friend they refer signs a
        lease, and the friend gets a welcome bonus too.
      </p>
      <Card className="mt-8 w-full">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-foreground/80">
            Your referral link and code are in your Ondo portal. Log in to copy them.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              {/* Login returns to state.from, so this lands on the user's own referral page. */}
              <Link to="/login" state={{ from: location }}>
                Log in to get your link
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Create an account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="mt-6 text-sm text-foreground/70">
        Questions about referrals?{" "}
        <a
          href="https://www.ondorealestate.com/contact/"
          className="font-medium text-primary underline underline-offset-4"
        >
          Contact Ondo
        </a>
        .
      </p>
    </section>
  )
}
