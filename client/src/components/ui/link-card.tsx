import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface LinkCardProps extends React.ButtonHTMLAttributes<HTMLAnchorElement> {
  href: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  featured?: boolean;
}

export function LinkCard({ href, title, description, icon: Icon, featured, className, ...props }: LinkCardProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "glass-card group relative flex items-center w-full p-4 mb-4 rounded-2xl overflow-hidden no-underline",
        featured && "border-primary/30 bg-linear-to-r from-primary/5 to-accent/10",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      data-testid={`link-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {featured && (
        <div className="absolute top-0 right-0 p-1.5 bg-primary text-[10px] font-bold text-white rounded-bl-xl flex items-center gap-1">
          <Heart className="w-3 h-3 fill-current" /> NEW
        </div>
      )}
      
      {Icon && (
        <div className="flex-shrink-0 mr-4 p-2.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
          <Icon className="w-5 h-5" />
        </div>
      )}
      
      <div className="flex-grow text-left">
        <h3 className="text-foreground font-semibold text-lg font-heading tracking-tight">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mt-0.5 font-medium">{description}</p>
        )}
      </div>

      <div className="flex-shrink-0 ml-4 text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all">
        <ArrowRight className="w-5 h-5" />
      </div>
    </motion.a>
  );
}
