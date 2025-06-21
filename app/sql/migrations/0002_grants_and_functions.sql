-- Custom SQL migration file, put your code below! --

-- This migration defines all table-level permissions and custom functions.

-- =================================================================
-- 1. Grants and Default Privileges
-- =================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- =================================================================
-- 2. Functions
-- =================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  delete from auth.users where id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Function to get comparison statistics for different time periods
CREATE OR REPLACE FUNCTION public.get_comparison_stats(
    profile_id_in uuid,
    this_month_start_in date,
    this_week_start_in date,
    last_month_start_in date,
    last_month_end_in date,
    last_week_start_in date,
    last_week_end_in date
)
RETURNS TABLE (
    this_month_duration bigint,
    last_month_duration bigint,
    this_month_records bigint,
    last_month_records bigint,
    this_week_duration bigint,
    last_week_duration bigint,
    this_week_records bigint,
    last_week_records bigint
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- This Month
        (SELECT COALESCE(SUM(dr.duration_minutes), 0)::bigint FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= this_month_start_in AND dr.date < (this_month_start_in + interval '1 month')) AS this_month_duration,
        (SELECT COUNT(*) FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= this_month_start_in AND dr.date < (this_month_start_in + interval '1 month')) AS this_month_records,
        -- Last Month
        (SELECT COALESCE(SUM(dr.duration_minutes), 0)::bigint FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= last_month_start_in AND dr.date <= last_month_end_in) AS last_month_duration,
        (SELECT COUNT(*) FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= last_month_start_in AND dr.date <= last_month_end_in) AS last_month_records,
        -- This Week
        (SELECT COALESCE(SUM(dr.duration_minutes), 0)::bigint FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= this_week_start_in AND dr.date < (this_week_start_in + interval '1 week')) AS this_week_duration,
        (SELECT COUNT(*) FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= this_week_start_in AND dr.date < (this_week_start_in + interval '1 week')) AS this_week_records,
        -- Last Week
        (SELECT COALESCE(SUM(dr.duration_minutes), 0)::bigint FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= last_week_start_in AND dr.date <= last_week_end_in) AS last_week_duration,
        (SELECT COUNT(*) FROM public.daily_records dr WHERE dr.profile_id = profile_id_in AND dr.date >= last_week_start_in AND dr.date <= last_week_end_in) AS last_week_records;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_comparison_stats(uuid, date, date, date, date, date, date) TO authenticated;