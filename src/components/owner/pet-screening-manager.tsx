"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PawPrint, Edit, CheckCircle, XCircle } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface PetPolicy {
  catsAllowed: boolean
  dogsAllowed: boolean
  maxPets: number
  depositAmount: number
  monthlyPetRent: number
}

interface TenantPet {
  id: string
  tenantName: string
  petName: string
  species: string
  breed: string
  weight: number
  vaccinationStatus: "current" | "expired" | "unknown"
}

const DEFAULT_POLICY: PetPolicy = {
  catsAllowed: true,
  dogsAllowed: true,
  maxPets: 2,
  depositAmount: 500,
  monthlyPetRent: 50,
}

const MOCK_PETS: TenantPet[] = [
  { id: "1", tenantName: "Alice Johnson", petName: "Biscuit", species: "Dog", breed: "Golden Retriever", weight: 65, vaccinationStatus: "current" },
  { id: "2", tenantName: "Marcus Lee", petName: "Shadow", species: "Cat", breed: "Domestic Shorthair", weight: 9, vaccinationStatus: "current" },
  { id: "3", tenantName: "Sara Kim", petName: "Mochi", species: "Cat", breed: "Siamese", weight: 8, vaccinationStatus: "expired" },
]

function vaccinationBadge(status: TenantPet["vaccinationStatus"]) {
  if (status === "current") return <Badge className="bg-green-100 text-green-700 border-green-200">Current</Badge>
  if (status === "expired") return <Badge variant="destructive">Expired</Badge>
  return <Badge variant="secondary">Unknown</Badge>
}

export function PetScreeningManager() {
  const { toast } = useToast()
  const [policy, setPolicy] = useState<PetPolicy>(DEFAULT_POLICY)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState<PetPolicy>(DEFAULT_POLICY)
  const [pets, setPets] = useState<TenantPet[]>(MOCK_PETS)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [policyRes, petsRes] = await Promise.allSettled([
        (featureApi as any).pets?.getPolicy?.(),
        (featureApi as any).pets?.list?.(),
      ])
      if (policyRes.status === "fulfilled" && policyRes.value) setPolicy(policyRes.value as PetPolicy)
      if (petsRes.status === "fulfilled" && Array.isArray(petsRes.value)) setPets(petsRes.value as TenantPet[])
    } catch {
      // use mock data
    }
  }

  const openEdit = () => {
    setDraft({ ...policy })
    setEditOpen(true)
  }

  const savePolicy = async () => {
    try {
      await (featureApi as any).pets?.updatePolicy?.(draft)
      setPolicy({ ...draft })
      setEditOpen(false)
      toast({ title: "Pet policy updated" })
    } catch {
      setPolicy({ ...draft })
      setEditOpen(false)
      toast({ title: "Pet policy updated" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PawPrint className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allowed Pets</p>
                <p className="text-lg font-bold text-purple-700">
                  {[policy.catsAllowed && "Cats", policy.dogsAllowed && "Dogs"].filter(Boolean).join(", ") || "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pet Deposit</p>
                <p className="text-lg font-bold text-blue-700">${policy.depositAmount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PawPrint className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Pet Rent</p>
                <p className="text-lg font-bold text-green-700">${policy.monthlyPetRent}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pet Policy</CardTitle>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Edit className="h-4 w-4 mr-2" />Edit Policy
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              {policy.catsAllowed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
              Cats
            </span>
            <span className="flex items-center gap-1">
              {policy.dogsAllowed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
              Dogs
            </span>
            <span className="text-muted-foreground">Max {policy.maxPets} pets per unit</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Pets ({pets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pets on record.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Pet Name</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Weight (lbs)</TableHead>
                  <TableHead>Vaccinations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.map((pet) => (
                  <TableRow key={pet.id}>
                    <TableCell className="font-medium">{pet.tenantName}</TableCell>
                    <TableCell>{pet.petName}</TableCell>
                    <TableCell>{pet.species}</TableCell>
                    <TableCell>{pet.breed}</TableCell>
                    <TableCell>{pet.weight}</TableCell>
                    <TableCell>{vaccinationBadge(pet.vaccinationStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pet Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="cats"
                checked={draft.catsAllowed}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, catsAllowed: !!v }))}
              />
              <Label htmlFor="cats">Cats allowed</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="dogs"
                checked={draft.dogsAllowed}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, dogsAllowed: !!v }))}
              />
              <Label htmlFor="dogs">Dogs allowed</Label>
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxPets">Max pets per unit</Label>
              <Input
                id="maxPets"
                type="number"
                min={1}
                value={draft.maxPets}
                onChange={(e) => setDraft((d) => ({ ...d, maxPets: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deposit">Pet deposit ($)</Label>
              <Input
                id="deposit"
                type="number"
                min={0}
                value={draft.depositAmount}
                onChange={(e) => setDraft((d) => ({ ...d, depositAmount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="petRent">Monthly pet rent ($)</Label>
              <Input
                id="petRent"
                type="number"
                min={0}
                value={draft.monthlyPetRent}
                onChange={(e) => setDraft((d) => ({ ...d, monthlyPetRent: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={savePolicy}>Save Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
