import { AlertCircle } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  resetKey?: any;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-sm opacity-80 mb-6">
              {this.state.error?.message || "يرجى المحاولة مرة أخرى لاحقاً."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-destructive text-destructive-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
