import React, { useState } from 'react';
import { GitBranch, Trash2, X } from 'lucide-react';
import { ContainerMetric, GitProjectStatus } from '../types.js';
import { authFetch } from '../utils/api.js';

interface GitProjectModalProps {
  containers: ContainerMetric[];
  existingNames: string[];
  editingProject: GitProjectStatus | null;
  onClose: () => void;
  onSaved: () => void;
}

export const GitProjectModal: React.FC<GitProjectModalProps> = ({
  containers,
  existingNames,
  editingProject,
  onClose,
  onSaved,
}) => {
  const [containerName, setContainerName] = useState(editingProject?.containerName ?? '');
  const [repoSlug, setRepoSlug] = useState(
    editingProject ? `${editingProject.repoOwner}/${editingProject.repoName}` : ''
  );
  const [branch, setBranch] = useState(editingProject?.branch ?? 'main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingProject);
  const availableContainers = containers.filter(
    (c) => c.name === editingProject?.containerName || !existingNames.includes(c.name)
  );

  const handleSave = async () => {
    setError(null);
    const [repoOwner, repoName] = repoSlug.split('/').map((s) => s.trim());
    if (!containerName || !repoOwner || !repoName) {
      setError('Pick a container and enter the repo as owner/name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authFetch(`/api/git-projects/${encodeURIComponent(containerName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoOwner, repoName, branch: branch.trim() || 'main' }),
      });
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!editingProject) return;
    setIsSubmitting(true);
    try {
      await authFetch(`/api/git-projects/${encodeURIComponent(editingProject.containerName)}`, {
        method: 'DELETE',
      });
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">{isEditing ? 'Edit git project' : 'Track a git project'}</h3>
            <p className="panel-sub">Checks GitHub for new commits on this repo's branch</p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label htmlFor="git-container" className="label block">
              Container
            </label>
            <select
              id="git-container"
              value={containerName}
              onChange={(e) => setContainerName(e.target.value)}
              disabled={isSubmitting || isEditing}
              className="field w-full"
            >
              <option value="" disabled>
                Select a container…
              </option>
              {availableContainers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="git-repo" className="label block">
              Repository
            </label>
            <input
              id="git-repo"
              type="text"
              placeholder="owner/repo"
              value={repoSlug}
              onChange={(e) => setRepoSlug(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="git-branch" className="label block">
              Branch
            </label>
            <input
              id="git-branch"
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
          </div>

          {error && <p className="text-[12px] text-state-bad">{error}</p>}

          <div className="flex items-center justify-between gap-2.5 pt-1">
            {isEditing ? (
              <button onClick={handleUnregister} disabled={isSubmitting} className="btn-ghost">
                <Trash2 className="h-3.5 w-3.5" />
                Stop tracking
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2.5">
              <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSubmitting} className="btn-primary">
                <GitBranch className="h-3.5 w-3.5" />
                {isEditing ? 'Update' : 'Track'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
