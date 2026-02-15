import { useState } from "react";
import { Tv } from "lucide-react";

interface LogoProps {
    className?: string;
}

export function Logo({ className = "w-10 h-10" }: LogoProps) {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className={`flex items-center justify-center rounded-xl gradient-accent ${className}`}>
                <Tv className="w-[50%] h-[50%] text-primary-foreground" />
            </div>
        );
    }

    return (
        <img
            src="/logo.png"
            alt="Logo"
            className={`object-contain ${className}`}
            onError={() => setError(true)}
        />
    );
}
