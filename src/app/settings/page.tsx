"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState("");
  const [nimApiKey, setNimApiKey] = useState("");
  const [defaultMode, setDefaultMode] = useState("viva");
  const [questionCount, setQuestionCount] = useState("10");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">Settings</h1>
        <p className="mt-2 text-muted">
          Configure your CodeSage preferences and API keys
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys */}
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg">API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                GitHub Token
              </label>
              <Input
                variant="dark"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">
                Required for private repositories.{" "}
                <a href="#" className="text-primary hover:underline">
                  Generate a token
                </a>
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                NVIDIA NIM API Key
              </label>
              <Input
                variant="dark"
                type="password"
                placeholder="nvapi-xxxxxxxxxxxx"
                value={nimApiKey}
                onChange={(e) => setNimApiKey(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">
                Get your API key from{" "}
                <a href="#" className="text-primary hover:underline">
                  build.nvidia.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exam Preferences */}
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg">Exam Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Default Exam Mode
              </label>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-surface px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="viva">Viva Voce</option>
                <option value="interview">Interview Prep</option>
                <option value="code-review">Code Review</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Default Question Count
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-surface px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
                <option value="15">15 questions</option>
                <option value="20">20 questions</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card variant="dark" className="border border-danger/30">
          <CardHeader>
            <CardTitle className="text-lg text-danger">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">Reset All Data</p>
                <p className="text-sm text-muted">
                  Delete all repositories, sessions, and scores
                </p>
              </div>
              <Button variant="danger" size="sm">
                Reset Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
          >
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
