import { createJob, getJob, listJobs, updateJob, deleteJob } from './store';
import { ValidationError } from './utils';
import { processTransform } from './jobs/transform';
import { processReport } from './jobs/report';
import { processReviewTransform, createApprovalResult, createRejectionResult } from './jobs/review';
import { JobType, Job } from './types';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

function processJob(job: Job): Job {
  const updated = updateJob(job.id, { status: 'processing' });

  try {
    switch (updated.type) {
      case 'transform': {
        const result = processTransform(updated.input);
        return updateJob(job.id, { status: 'complete', result });
      }
      case 'report': {
        const result = processReport(updated.input);
        return updateJob(job.id, { status: 'complete', result });
      }
      case 'review': {
        const processed = processReviewTransform(updated.input);
        return updateJob(job.id, { status: 'review', result: processed });
      }
      default:
        return updateJob(job.id, {
          status: 'failed',
          error: `Unknown job type: ${updated.type}`,
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = err instanceof ValidationError ? 'failed' : 'failed';
    return updateJob(job.id, { status, error: message });
  }
}

function matchRoute(
  method: string,
  pathname: string,
  target: string,
  targetMethod: string
): Record<string, string> | null {
  if (method !== targetMethod) return null;

  const targetParts = target.split('/');
  const pathParts = pathname.split('/');

  if (targetParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < targetParts.length; i++) {
    if (targetParts[i].startsWith(':')) {
      params[targetParts[i].slice(1)] = pathParts[i];
    } else if (targetParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // API routes
    if (pathname.startsWith('/api/')) {
      // POST /api/jobs/batch
      if (method === 'POST' && pathname === '/api/jobs/batch') {
        try {
          const body = (await request.json()) as { jobs: Array<{ type: JobType; input: unknown }> };
          if (!body.jobs || !Array.isArray(body.jobs)) {
            return errorResponse('Request body must contain a "jobs" array', 400);
          }

          const results: Job[] = [];
          for (const jobDef of body.jobs) {
            if (!jobDef.type || !jobDef.input) {
              return errorResponse('Each job must have "type" and "input"', 400);
            }
            const job = createJob(jobDef.type, jobDef.input);
            const processed = processJob(job);
            results.push(processed);
          }

          return jsonResponse({ jobs: results }, 201);
        } catch {
          return errorResponse('Invalid request body', 400);
        }
      }

      // POST /api/jobs
      if (method === 'POST' && pathname === '/api/jobs') {
        try {
          const body = (await request.json()) as { type: JobType; input: unknown };
          if (!body.type || !body.input) {
            return errorResponse('Request body must contain "type" and "input"', 400);
          }

          const validTypes: JobType[] = ['transform', 'report', 'review'];
          if (!validTypes.includes(body.type)) {
            return errorResponse(`Invalid job type: ${body.type}`, 400);
          }

          const job = createJob(body.type, body.input);
          const processed = processJob(job);
          return jsonResponse(processed, 201);
        } catch (err) {
          if (err instanceof SyntaxError) {
            return errorResponse('Invalid JSON in request body', 400);
          }
          return errorResponse('Invalid request body', 400);
        }
      }

      // GET /api/jobs
      if (method === 'GET' && pathname === '/api/jobs') {
        const status = url.searchParams.get('status') as any;
        const jobs = listJobs(status || undefined);
        return jsonResponse({ jobs });
      }

      // POST /api/jobs/:id/approve
      let params = matchRoute(method, pathname, '/api/jobs/:id/approve', 'POST');
      if (params) {
        const job = getJob(params.id);
        if (!job) return errorResponse('Job not found', 404);
        if (job.status !== 'review') {
          return errorResponse('Job is not in review status', 400);
        }

        const approvalResult = createApprovalResult(job.result as any);
        const updated = updateJob(job.id, { status: 'complete', result: approvalResult });
        return jsonResponse(updated);
      }

      // POST /api/jobs/:id/reject
      params = matchRoute(method, pathname, '/api/jobs/:id/reject', 'POST');
      if (params) {
        const job = getJob(params.id);
        if (!job) return errorResponse('Job not found', 404);
        if (job.status !== 'review') {
          return errorResponse('Job is not in review status', 400);
        }

        const rejectionResult = createRejectionResult(job.result as any);
        const updated = updateJob(job.id, { status: 'rejected', result: rejectionResult });
        return jsonResponse(updated);
      }

      // GET /api/jobs/:id
      params = matchRoute(method, pathname, '/api/jobs/:id', 'GET');
      if (params) {
        const job = getJob(params.id);
        if (!job) return errorResponse('Job not found', 404);
        return jsonResponse(job);
      }

      // DELETE /api/jobs/:id
      params = matchRoute(method, pathname, '/api/jobs/:id', 'DELETE');
      if (params) {
        const job = getJob(params.id);
        if (!job) return errorResponse('Job not found', 404);
        deleteJob(params.id);
        return new Response(null, { status: 204 });
      }

      return errorResponse('Not found', 404);
    }

    // Let Cloudflare Assets handle static files
    return errorResponse('Not found', 404);
  },
};
