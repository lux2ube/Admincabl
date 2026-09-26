import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-5">
      <Card className="cabl-card w-full max-w-md">
        <CardContent className="p-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><AlertCircle className="h-6 w-6" /></div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary">
              404 Page Not Found
            </h1>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
