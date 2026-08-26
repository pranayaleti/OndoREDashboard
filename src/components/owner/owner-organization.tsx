import { useEffect, useState } from "react"
import { applyBrandColor, type OrgBranding } from "@/lib/org-branding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Plus, Trash2, UserPlus } from "lucide-react"
import {
  organizationsApi,
  type Organization,
  type OrganizationMember,
  type OrgPendingInvite,
  type PlatformRole,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function OwnerOrganization() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selected, setSelected] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invites, setInvites] = useState<OrgPendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrgName, setNewOrgName] = useState("")
  const [creating, setCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [platformRole, setPlatformRole] = useState<PlatformRole>("owner")
  const [addingMember, setAddingMember] = useState(false)
  const [brandColor, setBrandColor] = useState("#ea580c")
  const [logoUrl, setLogoUrl] = useState("")
  const [savingBrand, setSavingBrand] = useState(false)
  const { toast } = useToast()

  // Keep the branding editor in sync with the selected org.
  useEffect(() => {
    const b = (selected?.branding as OrgBranding) ?? {}
    setBrandColor(b.primaryColor ?? "#ea580c")
    setLogoUrl(b.logoUrl ?? "")
  }, [selected])

  async function handleSaveBranding() {
    if (!selected) return
    setSavingBrand(true)
    try {
      const branding: OrgBranding = {
        primaryColor: brandColor,
        ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
      }
      const updated = await organizationsApi.update(selected.id, {
        branding: branding as Record<string, unknown>,
      })
      applyBrandColor(brandColor)
      setSelected(updated)
      setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      toast({ title: "Branding saved" })
    } catch (err) {
      console.error("Failed to save branding:", err)
      toast({ title: "Could not save branding", variant: "destructive" })
    } finally {
      setSavingBrand(false)
    }
  }

  async function loadOrgs(selectId?: string) {
    setLoading(true)
    try {
      const list = await organizationsApi.list()
      setOrgs(list)
      const next = selectId ? list.find((o) => o.id === selectId) : list[0]
      if (next) {
        setSelected(next)
        const [m, i] = await Promise.all([
          organizationsApi.listMembers(next.id),
          organizationsApi.listInvites(next.id),
        ])
        setMembers(m)
        setInvites(i)
      } else {
        setSelected(null)
        setMembers([])
        setInvites([])
      }
    } catch (err) {
      console.error("Failed to load organizations:", err)
      toast({ title: "Could not load organizations", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrgs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function selectOrg(org: Organization) {
    setSelected(org)
    try {
      const [m, i] = await Promise.all([
        organizationsApi.listMembers(org.id),
        organizationsApi.listInvites(org.id),
      ])
      setMembers(m)
      setInvites(i)
    } catch (err) {
      console.error("Failed to load organization detail:", err)
      setMembers([])
      setInvites([])
    }
  }

  async function handleCreate() {
    if (!newOrgName.trim()) return
    setCreating(true)
    try {
      const org = await organizationsApi.create({ name: newOrgName.trim() })
      setNewOrgName("")
      toast({ title: "Organization created" })
      await loadOrgs(org.id)
    } catch (err) {
      console.error("Failed to create organization:", err)
      toast({
        title: "Could not create organization",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  async function handleAddMember() {
    if (!selected || !inviteEmail.trim()) return
    setAddingMember(true)
    try {
      const result = await organizationsApi.inviteByEmail(
        selected.id,
        inviteEmail.trim(),
        "member",
        platformRole,
      )
      setInviteEmail("")
      toast({
        title: result.status === "added" ? "Member added" : `Invitation sent to ${result.email}`,
      })
      await selectOrg(selected)
    } catch (err) {
      console.error("Failed to invite member:", err)
      toast({
        title: "Could not send invite",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRevokeInvite(invite: OrgPendingInvite) {
    if (!selected) return
    try {
      await organizationsApi.revokeInvite(selected.id, invite.id)
      toast({ title: "Invitation revoked" })
      setInvites(await organizationsApi.listInvites(selected.id))
    } catch (err) {
      console.error("Failed to revoke invite:", err)
      toast({ title: "Could not revoke invitation", variant: "destructive" })
    }
  }

  async function handleRemoveMember(m: OrganizationMember) {
    if (!selected) return
    if (!window.confirm("Remove this member?")) return
    try {
      await organizationsApi.removeMember(selected.id, m.userId)
      toast({ title: "Member removed" })
      setMembers(await organizationsApi.listMembers(selected.id))
    } catch (err) {
      console.error("Failed to remove member:", err)
      toast({ title: "Could not remove member", variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Organization</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Group your team or property-management firm. Members you add can be given access to shared
        resources as org features roll out.
      </p>

      {/* Create */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Create an organization</CardTitle>
          <CardDescription>You'll be added as its admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Acme Property Management"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="sm:max-w-sm"
            />
            <Button onClick={handleCreate} disabled={creating || !newOrgName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : orgs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You're not part of any organization yet. Create one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Org list */}
          <div className="flex flex-col gap-2">
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => selectOrg(org)}
                className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                  selected?.id === org.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="font-medium truncate">{org.name}</div>
                <div className="text-xs text-muted-foreground">{org.slug}</div>
              </button>
            ))}
          </div>

          {/* Selected org detail */}
          {selected ? (
            <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{selected.name}</CardTitle>
                  <Badge variant="secondary">{selected.type === "team" ? "Team" : "PM firm"}</Badge>
                </div>
                <CardDescription>{members.length} member{members.length === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 mb-6">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || m.userId}
                        </div>
                        {m.email ? (
                          <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                        ) : null}
                        <Badge variant="outline" className="mt-1">
                          {m.role === "org_admin" ? "Admin" : "Member"}
                        </Badge>
                      </div>
                      {m.role !== "org_admin" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(m)}
                          aria-label="Remove member"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>

                {invites.length > 0 ? (
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Pending invitations</p>
                    <div className="flex flex-col gap-2">
                      {invites.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm truncate">{inv.email}</div>
                            <Badge variant="outline" className="mt-1">
                              Invited · {inv.orgRole === "org_admin" ? "Admin" : "Member"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(inv)}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Label htmlFor="invite-email" className="text-sm">
                  Invite a member by email
                </Label>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="sm:max-w-xs"
                  />
                  <Select value={platformRole} onValueChange={(v) => setPlatformRole(v as PlatformRole)}>
                    <SelectTrigger className="sm:w-40" aria-label="Account type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleAddMember}
                    disabled={addingMember || !inviteEmail.trim()}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {addingMember ? "Inviting…" : "Invite"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Existing Ondo accounts are added right away. New emails get an invitation to sign up
                  with the selected account type and join automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Branding</CardTitle>
                <CardDescription>
                  White-label the dashboard for this organization. The brand color themes the app
                  accent for its members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <Label htmlFor="brand-color" className="text-sm">
                      Brand color
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        id="brand-color"
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-9 w-12 rounded border border-border bg-transparent p-1"
                        aria-label="Brand color"
                      />
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-28 font-mono"
                        aria-label="Brand color hex"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="brand-logo" className="text-sm">
                      Logo URL (optional)
                    </Label>
                    <Input
                      id="brand-logo"
                      type="url"
                      placeholder="https://…/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                {logoUrl.trim() ? (
                  <div className="mt-4">
                    <span className="text-xs text-muted-foreground">Logo preview</span>
                    <img
                      src={logoUrl.trim()}
                      alt="Organization logo preview"
                      className="mt-1 h-10 w-auto max-w-[200px] object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                ) : null}

                <div className="flex items-center gap-3 mt-5">
                  <Button onClick={handleSaveBranding} disabled={savingBrand}>
                    {savingBrand ? "Saving…" : "Save branding"}
                  </Button>
                  <span
                    className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium"
                    style={{ backgroundColor: brandColor, color: "#fff" }}
                  >
                    Accent preview
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Full white-label (custom domains, branded emails) is a later phase.
                </p>
              </CardContent>
            </Card>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
