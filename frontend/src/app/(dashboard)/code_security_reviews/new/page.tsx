'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { useCreateCodeSecurityReview } from '@/hooks/useCodeSecurityReviews';
import { cn } from '@/lib/utils';
import { CodeSecurityRepositorySelector } from '@/components/code-security/CodeSecurityRepositorySelector';
import { CodeSecurityBranchPicker } from '@/components/code-security/CodeSecurityBranchPicker';
import { CodeSecurityLLMConfig } from '@/components/code-security/CodeSecurityLLMConfig';

type Step = 1 | 2 | 3 | 4;

const STEPS: { number: Step; title: string; description: string }[] = [
  {
    number: 1,
    title: 'Select Repository',
    description: 'Choose the repository to scan',
  },
  {
    number: 2,
    title: 'Choose Branch',
    description: 'Select the branch to analyze',
  },
  {
    number: 3,
    title: 'Configure Analysis',
    description: 'Set LLM provider and scan options',
  },
  {
    number: 4,
    title: 'Review & Submit',
    description: 'Confirm settings and start analysis',
  },
];

export default function NewCodeSecurityReviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [titulo, setTitulo] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [llmProvider, setLlmProvider] = useState('anthropic');
  const [scanMode, setScanMode] = useState('PUBLIC_URL');
  const [repoToken, setRepoToken] = useState('');

  const createReview = useCreateCodeSecurityReview();
  const isLoading = createReview.isPending;

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !selectedRepoUrl) {
      toast.error('Please select a repository');
      return;
    }
    if (currentStep === 2 && !selectedBranch) {
      toast.error('Please select a branch');
      return;
    }
    if (currentStep === 3 && !llmProvider) {
      toast.error('Please select an LLM provider');
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      toast.error('Please enter a scan title');
      return;
    }

    const reviewData: {
      titulo: string;
      descripcion: string | null;
      url_repositorio: string;
      rama_analizar: string;
      scan_mode: 'PUBLIC_URL' | 'REPO_TOKEN' | 'BRANCH_TARGET' | 'ORG_BATCH';
      scr_config: {
        llm_provider: string;
        temperature: number;
        max_tokens: number;
      };
      repo_token?: string;
    } = {
      titulo: titulo.trim(),
      descripcion: description.trim() || null,
      url_repositorio: selectedRepoUrl,
      rama_analizar: selectedBranch,
      scan_mode: scanMode as 'PUBLIC_URL' | 'REPO_TOKEN' | 'BRANCH_TARGET' | 'ORG_BATCH',
      scr_config: {
        llm_provider: llmProvider,
        temperature: 0.3,
        max_tokens: 4096,
      },
      ...(scanMode === 'REPO_TOKEN' && { repo_token: repoToken }),
    };

    createReview.mutate(reviewData, {
      onSuccess: (data: { id: string }) => {
        toast.success('Scan created! Starting analysis...');
        // Redirect to the detail page
        router.push(`/code_security_reviews/${data.id}`);
      },
      onError: (error: { message: string }) => {
        toast.error(error.message || 'Failed to create scan');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">New Code Security Scan</h1>
          <p className="text-muted-foreground">
            Analyze your repository for malicious code patterns, backdoors, and security threats
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all',
                    currentStep >= step.number
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step.number}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 transition-all',
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            {STEPS.map((step) => (
              <div key={step.number} className="flex-1">
                <p
                  className={cn(
                    'text-xs font-medium',
                    currentStep === step.number ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-white/[0.1] bg-white/[0.02] backdrop-blur-xl mb-8">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Repository Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Select a Repository
                  </label>
                  <CodeSecurityRepositorySelector
                    selectedUrl={selectedRepoUrl}
                    onSelect={(url: string, repo: { name: string }) => {
                      setSelectedRepoUrl(url);
                      setTitulo(`${repo.name} Security Review`);
                    }}
                  />
                </div>
                {selectedRepoUrl && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      ✓ Repository selected: {selectedRepoUrl}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Branch Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Select Branch
                  </label>
                  <CodeSecurityBranchPicker
                    repositoryUrl={selectedRepoUrl}
                    selectedBranch={selectedBranch}
                    onSelect={setSelectedBranch}
                  />
                </div>
                {selectedBranch && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      ✓ Branch selected: {selectedBranch}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Configuration */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Scan Mode
                  </label>
                  <select
                    value={scanMode}
                    onChange={(e) => setScanMode(e.target.value as 'PUBLIC_URL' | 'REPO_TOKEN')}
                    className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="PUBLIC_URL">Public Repository (no auth)</option>
                    <option value="REPO_TOKEN">With GitHub Token</option>
                  </select>
                  {scanMode === 'REPO_TOKEN' && (
                    <Input
                      type="password"
                      placeholder="GitHub personal access token"
                      value={repoToken}
                      onChange={(e) => setRepoToken(e.target.value)}
                      className="mt-3"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    LLM Provider
                  </label>
                  <CodeSecurityLLMConfig
                    selectedProvider={llmProvider}
                    onSelect={setLlmProvider}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Scan Title
                  </label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="e.g., Q2 Security Audit"
                  />
                  {!titulo && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠ This field is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this scan..."
                    className="w-full h-24 px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.1] space-y-3">
                  <h3 className="font-semibold text-foreground">Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Repository:</dt>
                      <dd className="font-mono text-foreground text-xs">{selectedRepoUrl}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Branch:</dt>
                      <dd className="font-mono text-foreground">{selectedBranch}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Scan Mode:</dt>
                      <dd className="text-foreground">{scanMode}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">LLM Provider:</dt>
                      <dd className="text-foreground capitalize">{llmProvider}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
          >
            ← Previous
          </Button>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={isLoading} className="min-w-32">
                Next →
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                >
                  Back to Start
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !titulo.trim()}
                  className="min-w-32 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Creating...' : 'Start Scan'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
