import { motion } from "framer-motion";
import { MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display text-foreground">Kohay</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Community
          </a>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="hero"
            size="sm"
            className="rounded-full px-6"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
