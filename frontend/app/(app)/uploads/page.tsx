import { Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UploadsPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Uploads</h1>
          <Badge variant="outline">Phase 2</Badge>
        </div>
        <p className="text-muted-foreground">
          Dedicated file manager across all jobs — photos, proposals, contracts,
          signed change orders. Timestamped, geotagged, immutable.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <CardTitle className="pt-3">Ships week 4</CardTitle>
          <CardDescription>Planned scope — treat project photos as legal evidence</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Cross-opportunity photo / file browser</li>
            <li>• EXIF preservation + server-side timestamp + GPS metadata</li>
            <li>• Per-file immutable flag (liability shield for contractor)</li>
            <li>• Upload via drag-drop, mobile camera, or bulk import</li>
            <li>• Optional portal visibility per file (show homeowner vs keep internal)</li>
            <li>• Cloudflare R2 storage with signed URLs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
