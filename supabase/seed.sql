with seed_user as (
  select id
  from auth.users
  limit 1
),
upsert_user as (
  insert into public.users (id, full_name, role)
  select id, 'ProofFit Demo User', 'job_seeker'
  from seed_user
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now()
  returning id
),
upsert_privacy as (
  insert into public.privacy_preferences (user_id, delete_raw_uploads, save_structured_resume, allow_product_analytics)
  select id, true, true, true
  from upsert_user
  on conflict (user_id) do update
    set save_structured_resume = excluded.save_structured_resume,
        updated_at = now()
  returning user_id
),
seed_resume as (
  insert into public.resumes (user_id, file_name, file_type, extracted_text, structured_resume, storage_opt_in)
  select
    id,
    'demo-data-engineer-resume.pdf',
    'application/pdf',
    'Summary
Data engineer with SQL, Python, Airflow, dbt, and Redshift experience.
Skills
SQL
Python
Airflow
dbt
Redshift
Experience
Built ELT pipelines in Python and SQL for finance reporting workloads.
Maintained Redshift tables and improved data quality for executive dashboards.',
    '{
      "contactInfo": ["demo@example.com"],
      "summary": ["Data engineer with SQL, Python, Airflow, dbt, and Redshift experience."],
      "skills": ["SQL", "Python", "Airflow", "dbt", "Redshift"],
      "workExperience": [
        "Built ELT pipelines in Python and SQL for finance reporting workloads.",
        "Maintained Redshift tables and improved data quality for executive dashboards."
      ],
      "education": ["B.S. in Information Systems"],
      "certifications": [],
      "projects": []
    }'::jsonb,
    true
  from upsert_user
  returning id, user_id
),
seed_jd as (
  insert into public.job_descriptions (user_id, company_name, role_title, raw_text, analysis)
  select
    user_id,
    'Northbeam Data',
    'Senior Data Engineer',
    'We need a Senior Data Engineer with SQL, Python, Airflow, dbt, and Snowflake experience. You will own orchestration and warehouse reliability.',
    '{
      "mustHaveSkills": ["sql", "python", "airflow", "dbt", "snowflake"],
      "preferredSkills": ["kubernetes"],
      "toolsPlatforms": ["airflow", "dbt", "snowflake"],
      "domainKeywords": ["warehouse reliability", "orchestration"],
      "responsibilities": ["Own orchestration and warehouse reliability."],
      "certifications": [],
      "softSkills": ["ownership"],
      "seniority": "Senior"
    }'::jsonb
  from seed_resume
  returning id, user_id
),
seed_session as (
  insert into public.tailoring_sessions (user_id, resume_id, job_description_id, status, ats_safe_mode, primary_domain)
  select
    seed_resume.user_id,
    seed_resume.id,
    seed_jd.id,
    'draft',
    true,
    'Data Engineering'
  from seed_resume
  join seed_jd on seed_jd.user_id = seed_resume.user_id
  returning id, user_id
),
seed_suggestion as (
  insert into public.tailoring_suggestions (
    tailoring_session_id,
    original_bullet,
    suggested_bullet,
    rewrite_reason,
    confidence_score,
    supported_by_resume,
    status
  )
  select
    id,
    'Built ELT pipelines in Python and SQL for finance reporting workloads.',
    'Built Python and SQL ELT pipelines for finance reporting workloads with clearer ownership language for orchestration-related work.',
    'Clarifies ownership without adding unsupported technologies.',
    0.910,
    true,
    'accepted'
  from seed_session
  returning id, tailoring_session_id
),
seed_evidence as (
  insert into public.suggestion_evidence_links (
    suggestion_id,
    source_resume_snippet,
    matched_jd_snippet,
    evidence_type
  )
  select
    id,
    'Built ELT pipelines in Python and SQL for finance reporting workloads.',
    'Own orchestration and warehouse reliability.',
    'resume_to_jd'
  from seed_suggestion
  returning suggestion_id
),
seed_scores as (
  insert into public.scores (
    tailoring_session_id,
    terminology_coverage_score,
    evidence_coverage_score,
    ats_formatting_risk_score,
    readability_score,
    domain_fit_score,
    seniority_alignment_score,
    notes
  )
  select
    tailoring_session_id,
    82,
    96,
    91,
    88,
    84,
    79,
    '{"seed": true}'::jsonb
  from seed_suggestion
  returning tailoring_session_id
),
seed_version as (
  insert into public.resume_versions (
    tailoring_session_id,
    user_id,
    company_name,
    role_title,
    accepted_suggestion_ids,
    final_resume
  )
  select
    seed_session.id,
    seed_session.user_id,
    'Northbeam Data',
    'Senior Data Engineer',
    array[seed_suggestion.id]::uuid[],
    '{
      "summary": ["Data engineer with SQL, Python, Airflow, dbt, and Redshift experience."],
      "experience": [
        "Built Python and SQL ELT pipelines for finance reporting workloads with clearer ownership language for orchestration-related work.",
        "Maintained Redshift tables and improved data quality for executive dashboards."
      ]
    }'::jsonb
  from seed_session
  join seed_suggestion on seed_suggestion.tailoring_session_id = seed_session.id
  returning id, user_id
),
seed_export as (
  insert into public.exports (user_id, resume_version_id, format, file_name)
  select
    user_id,
    id,
    'pdf',
    'northbeam-senior-data-engineer.pdf'
  from seed_version
  returning user_id
),
seed_subscription as (
  insert into public.subscriptions (user_id, plan, status)
  select
    id,
    'pro',
    'active'
  from upsert_user
  on conflict (user_id) do update
    set plan = excluded.plan,
        status = excluded.status,
        updated_at = now()
  returning user_id
)
insert into public.audit_logs (user_id, action, entity_type, metadata)
select
  upsert_user.id,
  'seed_data_loaded',
  'workspace',
  jsonb_build_object('source', 'supabase/seed.sql')
from upsert_user;
