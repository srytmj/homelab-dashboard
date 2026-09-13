import React, { useState } from 'react';
import { Download, GitBranch, Plus, RefreshCw } from 'lucide-react';
import { CockpitSnapshot, GitProjectStatus } from '../types.js';
import { GitProjectModal } from '../components/GitProjectModal.js';
import { GitPullModal } from '../components/GitPullModal.js';

interface GitProjectsPageProps {
  snapshot: CockpitSnapshot | null;
  onRefetch: () => void;
}

export const GitProjectsPage: React.FC<GitProjectsPageProps> = ({ snapshot, onRefetch }) => {
  const [editingProject, setEditingProject] = useState<GitProjectStatus | null>(null);
  const [pullingProject, setPullingProject] = useState<GitProjectStatus | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const projects = snapshot?.gitProjects ?? [];
  const containers = snapshot?.containers ?? [];
  const isEditModalOpen = isAdding || editingProject !== null;

  const closeEditModal = () => {
    setIsAdding(false);
    setEditingProject(null);
  };

  return (
    <section className="panel overflow-hidden">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Git projects</h2>
          <p className="panel-sub">
            {projects.length === 0 ? 'Nothing tracked yet' : `${projects.length} tracked`} · checked against GitHub
            every few minutes
          </p>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-primary">
          <Plus className="h-3.5 w-3.5" />
          Track a project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="animate-fadeIn px-5 py-10 text-center text-[13px] text-cockpit-muted">
          Track a container that's built from your own git repo — a personal project, not an off-the-shelf
          service — to see when it has new commits upstream.
        </p>
      ) : (
        <div className="px-5 py-1.5">
          {projects.map((project) => {
            const canPull = Boolean(project.localPath && project.rebuildCommand);

            return (
              <div key={project.containerName} className="data-row gap-3">
                <button
                  onClick={() => setEditingProject(project)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  title="Edit this project"
                >
                  <GitBranch className="h-3.5 w-3.5 shrink-0 text-cockpit-muted" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-cockpit-text">{project.containerName}</span>
                    <span className="block truncate font-mono text-[11px] text-cockpit-muted">
                      {project.repoOwner}/{project.repoName}@{project.branch}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-2.5">
                  {project.latestCommitMessage ? (
                    <span className="hidden text-right sm:block">
                      <span className="block max-w-[240px] truncate text-[12px] text-cockpit-text">
                        {project.latestCommitMessage}
                      </span>
                      <span className="block font-mono text-[10.5px] text-cockpit-muted">
                        {project.latestCommitDate ? new Date(project.latestCommitDate).toLocaleString() : ''}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-cockpit-muted">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      checking…
                    </span>
                  )}
                  <span className={`pill ${project.hasUpdate ? 'pill-warn' : 'pill-neutral'}`}>
                    {project.hasUpdate ? 'Update available' : project.lastKnownSha ? 'Up to date' : 'Not deployed yet'}
                  </span>
                  <button
                    onClick={() => setPullingProject(project)}
                    disabled={!canPull}
                    title={canPull ? 'Pull & rebuild' : 'Set a local path and rebuild command to enable this'}
                    className="icon-btn hover:border-cockpit-accent/40 hover:text-cockpit-accent disabled:opacity-30"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isEditModalOpen && (
        <GitProjectModal
          containers={containers}
          existingNames={projects.map((p) => p.containerName)}
          editingProject={editingProject}
          onClose={closeEditModal}
          onSaved={onRefetch}
        />
      )}

      {pullingProject && (
        <GitPullModal project={pullingProject} onClose={() => setPullingProject(null)} onSuccess={onRefetch} />
      )}
    </section>
  );
};
