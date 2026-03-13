import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield, Smartphone } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/lib/supabase"

interface TwoFactorAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentValue: boolean
  onConfirm: (enabled: boolean, method?: string, code?: string) => void
}

export function TwoFactorAuthDialog({
  open,
  onOpenChange,
  currentValue,
  onConfirm,
}: TwoFactorAuthDialogProps) {
  const [method, setMethod] = useState<"sms" | "app">("app")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const { toast } = useToast()

  // Load TOTP factor when dialog opens with method === "app"
  useEffect(() => {
    if (!open || currentValue) return

    if (method === "app") {
      const enrollApp = async () => {
        setIsProcessing(true)
        try {
          if (!supabase) throw new Error("Supabase client is not configured")
          
          // Enroll TOTP
          const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" })
          if (error) {
            // Note: If session is missing or persistSession is false, this throws.
            console.error("Supabase MFA Enroll Error:", error.message)
            throw error
          }
          
          setFactorId(data.id)
          if (data.totp?.qr_code) {
             setQrCode(data.totp.qr_code)
          }
        } catch (error: any) {
          console.error("MFA Initialization failed:", error)
          // Fallback UI or silent error if just mocking for now
        } finally {
          setIsProcessing(false)
        }
      }
      enrollApp()
    }
  }, [open, method, currentValue])

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter your phone number.",
        variant: "destructive",
      })
      return
    }

    setIsSendingCode(true)
    try {
      if (!supabase) throw new Error("Supabase client is not configured")
      
      const { data: enrollData, error: enrollError } = await (supabase as any).auth.mfa.enroll({
        factorType: "phone",
        phone: phoneNumber,
      })
      
      if (enrollError) {
        console.error("Supabase MFA Phone Enroll Error:", enrollError.message)
        throw enrollError
      }
      
      setFactorId(enrollData.id)

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      })
      if (challengeError) throw challengeError

      setChallengeId(challengeData.id)

      setIsCodeSent(true)
      toast({
        title: "Code Sent",
        description: "We've sent a verification code to your phone.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send code. (Check Supabase config)",
        variant: "destructive",
      })
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleConfirm = async () => {
    if (currentValue) {
      // Disabling 2FA
      setIsProcessing(true)
      try {
        if (!supabase) throw new Error("Supabase client is not configured")
        
        const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
        if (factorsErr) throw factorsErr

        // Unenroll all verified factors
        const allFactors = factors?.all || []
        for (const factor of allFactors) {
          if (factor.status === "verified") {
            await supabase.auth.mfa.unenroll({ factorId: factor.id })
          }
        }

        onConfirm(false)
        toast({
          title: "Two-Factor Authentication Disabled",
          description: "Your account is no longer protected by two-factor authentication.",
        })
        onOpenChange(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to disable two-factor authentication.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    } else {
      // Enabling 2FA
      if (method === "sms" && (!phoneNumber || !isCodeSent)) {
        toast({
          title: "Error",
          description: "Please send a verification code first.",
          variant: "destructive",
        })
        return
      }

      if (!verificationCode) {
        toast({
          title: "Error",
          description: "Please enter the verification code.",
          variant: "destructive",
        })
        return
      }

      setIsProcessing(true)
      try {
        if (!supabase) throw new Error("Supabase client is not configured")

        if (method === "app") {
          if (!factorId) throw new Error("Missing factor ID. Please close and try again.")
          const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
          if (challengeErr) throw challengeErr
          
          const { error: verifyErr } = await supabase.auth.mfa.verify({
             factorId,
             challengeId: challengeData.id,
             code: verificationCode
          })
          if (verifyErr) throw verifyErr
        } else if (method === "sms") {
          if (!factorId || !challengeId) throw new Error("Missing SMS challenge.")
          const { error: verifyErr } = await supabase.auth.mfa.verify({
             factorId,
             challengeId,
             code: verificationCode
          })
          if (verifyErr) throw verifyErr
        }

        onConfirm(true, method, verificationCode)
        toast({
          title: "Two-Factor Authentication Enabled",
          description: `Your account is now protected by two-factor authentication via ${method === "app" ? "authenticator app" : "SMS"}.`,
        })
        setPhoneNumber("")
        setVerificationCode("")
        setIsCodeSent(false)
        onOpenChange(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to verify access code.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleCancel = () => {
    setPhoneNumber("")
    setVerificationCode("")
    setIsCodeSent(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {currentValue ? "Disable Two-Factor Authentication" : "Enable Two-Factor Authentication"}
          </DialogTitle>
          <DialogDescription>
            {currentValue
              ? "Are you sure you want to disable two-factor authentication? This will reduce the security of your account."
              : "Add an extra layer of security to your account by enabling two-factor authentication."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!currentValue && (
            <>
              <div className="space-y-3">
                <Label>Authentication Method</Label>
                <RadioGroup value={method} onValueChange={(value) => setMethod(value as "sms" | "app")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="app" id="app" />
                    <Label htmlFor="app" className="flex items-center gap-2 cursor-pointer">
                      <Smartphone className="h-4 w-4" />
                      Authenticator App (Recommended)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="cursor-pointer">SMS Text Message</Label>
                  </div>
                </RadioGroup>
              </div>

              {method === "sms" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isProcessing || isCodeSent || isSendingCode}
                        className="flex-1"
                      />
                      {!isCodeSent ? (
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={handleSendCode} 
                          disabled={isSendingCode || !phoneNumber}
                        >
                          {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Code"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsCodeSent(false)}
                          disabled={isProcessing}
                        >
                          Change
                        </Button>
                      )}
                    </div>
                    {!isCodeSent && (
                      <p className="text-xs text-muted-foreground">
                        We'll send a verification code to this number
                      </p>
                    )}
                  </div>
                </div>
              )}

              {method === "app" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code below.
                  </p>
                  <div className="border rounded-md p-4 bg-muted/50 flex items-center justify-center">
                    {qrCode ? (
                      <div dangerouslySetInnerHTML={{ __html: qrCode }} className="w-48 h-48" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 py-8 text-xs text-muted-foreground">
                        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mb-2" /> : "Failed to load QR Code"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(method === "app" || (method === "sms" && isCodeSent)) && (
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isProcessing}
                    maxLength={6}
                  />
                </div>
              )}
            </>
          )}

          {currentValue && (
            <div className="rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Disabling two-factor authentication will make your account less secure. You'll only need your password to sign in.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={currentValue ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {currentValue ? "Disabling..." : "Enabling..."}
              </>
            ) : (
              currentValue ? "Disable 2FA" : "Enable 2FA"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

