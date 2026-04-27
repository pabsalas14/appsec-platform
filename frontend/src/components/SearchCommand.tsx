"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bug,
  BookOpen,
  CheckCircle,
  Command,
  FileText,
  Lightbulb,
  Loader,
  Search,
  Shield,
  Target,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui";

interface SearchResult {
  tipo: string;
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
}

interface GroupedResults {
  [category: string]: SearchResult[];
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Vulnerabilidad: Bug,
  Plan: CheckCircle,
  Tema: Lightbulb,
  Iniciativa: Target,
  "Hallazgo SAST": Bug,
  "Hallazgo DAST": AlertTriangle,
  "Hallazgo MAST": Shield,
  Control: BookOpen,
  Auditoría: FileText,
};

export function SearchCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search as user types
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults({});
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/search?q=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.data?.results || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResults({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      } else {
        setResults({});
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    setResults({});
    router.push(url);
  };

  const totalResults = Object.values(results).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Search vulnerabilities, plans, themes, initiatives..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {error && (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!isLoading && !error && query && totalResults === 0 && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {!isLoading && !error && !query && (
          <div className="px-2 py-4">
            <p className="text-xs text-muted-foreground">
              Type to search across vulnerabilities, plans, themes, initiatives, and more.
            </p>
          </div>
        )}

        {Object.entries(results).map(([category, items]) =>
          items.length > 0 ? (
            <CommandGroup key={category} heading={category}>
              {items.map((result) => {
                const IconComponent =
                  TYPE_ICONS[result.tipo] || Search;

                return (
                  <CommandItem
                    key={`${category}-${result.id}`}
                    value={result.nombre}
                    onSelect={() => handleSelect(result.url)}
                  >
                    <IconComponent className="mr-2 h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-medium text-sm">
                        {result.nombre}
                      </div>
                      {result.descripcion && (
                        <div className="truncate text-xs text-muted-foreground">
                          {result.descripcion.substring(0, 100)}
                          {result.descripcion.length > 100 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function SearchCommandTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        // This will be handled by the SearchCommand component
        // Just trigger the open via keyboard shortcut
        const event = new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      }}
      className="hidden h-9 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent md:inline-flex"
    >
      <span className="inline-flex items-center gap-1 text-muted-foreground/80">
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
      </span>
      <span className="ml-auto rounded border border-border px-1.5 text-[10px] font-medium leading-5 text-muted-foreground">
        Ctrl K
      </span>
    </button>
  );
}
