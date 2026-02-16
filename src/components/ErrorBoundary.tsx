import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Algo deu errado</h1>
                            <p className="text-muted-foreground text-sm">
                                Ocorreu um erro inesperado. Tente recarregar a página.
                            </p>
                        </div>
                        {this.state.error && (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-left">
                                <p className="text-xs font-mono text-destructive/80 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Button onClick={this.handleReset} variant="outline" className="gap-2">
                                <RefreshCw className="w-4 h-4" /> Tentar novamente
                            </Button>
                            <Button onClick={() => window.location.reload()} className="gradient-accent text-primary-foreground gap-2">
                                Recarregar página
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
