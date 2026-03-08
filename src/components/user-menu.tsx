import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/auth-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User, Home, Building, Shield, Wrench } from "lucide-react"
import { Link } from "react-router-dom"

export default function UserMenu() {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  // Determine dashboard path based on user role using centralized utility
  const dashboardPath = getDashboardPath(user.role)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profilePicture || `${import.meta.env.BASE_URL}placeholder.svg?height=40&width=40&query=user`} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{`${user.firstName} ${user.lastName}`}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={dashboardPath} className="cursor-pointer">
              {user.role === "tenant" ? (
                <Home className="mr-2 h-4 w-4" />
              ) : user.role === "owner" ? (
                <Building className="mr-2 h-4 w-4" />
              ) : user.role === "maintenance" ? (
                <Wrench className="mr-2 h-4 w-4" />
              ) : user.role === "super_admin" || user.role === "admin" ? (
                <Shield className="mr-2 h-4 w-4" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`${dashboardPath}/profile`} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
