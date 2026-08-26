import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Trash2, UserPlus } from "lucide-react"
import {
  organizationsApi,
  type Organization,
  type OrganizationMember,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function OwnerOrganization() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selected, setSelected] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrgName, setNewOrgName] = useState("")
  const [creating, setCreating] = useState(false)
  const [newMemberId, setNewMemberId] = useState("")
  const [addingMember, setAddingMember] = useState(false)
  const { toast } = useToast()

  async function loadOrgs(selectId?: string) {
    setLoading(true)
    try {
      const list = await organizationsApi.list()
      setOrgs(list)
      const next = selectId ? list.find((o) => o.id === selectId) : list[0]
      if (next) {
        setSelected(next)
        setMembers(await organizationsApi.listMembers(next.id))
      } else {
        setSelected(null)
        setMembers([])
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
      setMembers(await organizationsApi.listMembers(org.id))
    } catch (err) {
      console.error("Failed to load members:", err)
      setMembers([])
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
    if (!selected || !newMemberId.trim()) return
    setAddingMember(true)
    try {
      await organizationsApi.addMember(selected.id, newMemberId.trim())
      setNewMemberId("")
      toast({ title: "Member added" })
      setMembers(await organizationsApi.listMembers(selected.id))
    } catch (err) {
      console.error("Failed to add member:", err)
      toast({
        title: "Could not add member",
        description: err instanceof Error ? err.message : "Check the user ID and try again.",
        variant: "destructive",
      })
    } finally {
      setAddingMember(false)
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
                        <div className="text-sm font-mono truncate">{m.userId}</div>
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

                <Label htmlFor="add-member" className="text-sm">
                  Add a member by user ID
                </Label>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <Input
                    id="add-member"
                    placeholder="user UUID"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="sm:max-w-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddMember}
                    disabled={addingMember || !newMemberId.trim()}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {addingMember ? "Adding…" : "Add"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Invite-by-email is coming next; for now, add by user ID.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}
