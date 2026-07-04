import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Repository } from "@/types";

interface RepositoryCardProps {
  repository: Repository;
}

const statusColors: Record<string, string> = {
  pending: "text-muted",
  cloning: "text-info",
  parsing: "text-info",
  indexing: "text-info",
  ready: "text-success",
  error: "text-danger",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  cloning: "Cloning...",
  parsing: "Parsing...",
  indexing: "Indexing...",
  ready: "Ready",
  error: "Error",
};

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <Card variant="dark" padding="none" className="overflow-hidden">
      <CardHeader className="border-b border-hairline p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-base">{repository.name}</CardTitle>
            {repository.description && (
              <p className="mt-1 text-sm text-muted truncate">{repository.description}</p>
            )}
          </div>
          <span className={`ml-2 text-xs font-medium ${statusColors[repository.status]}`}>
            {statusLabels[repository.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 text-xs text-muted">
          {repository.language && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {repository.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {(repository.stars ?? 0).toLocaleString()}
          </span>
          {repository.stats && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {repository.stats?.sourceFiles ?? 0} files
            </span>
          )}
        </div>
        {repository.status === "ready" && (
          <div className="mt-4 flex gap-2">
            <Link href={`/exam?repo=${repository.id}`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                Start Exam
              </Button>
            </Link>
            <Link href={`/repositories/${repository.id}`}>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
