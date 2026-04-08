import { Job, JobType, JobStatus } from './types';
import { generateId } from './utils';

const jobs = new Map<string, Job>();

export function createJob(type: JobType, input: unknown): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: generateId(),
    type,
    status: 'pending',
    input,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(status?: JobStatus): Job[] {
  const all = Array.from(jobs.values());
  if (status) {
    return all.filter((j) => j.status === status);
  }
  return all;
}

export function updateJob(id: string, updates: Partial<Job>): Job {
  const job = jobs.get(id);
  if (!job) {
    throw new Error(`Job ${id} not found`);
  }
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}

export function deleteJob(id: string): boolean {
  return jobs.delete(id);
}
