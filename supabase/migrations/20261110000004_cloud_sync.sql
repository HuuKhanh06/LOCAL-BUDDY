-- Migration 04: Bảng đồng bộ trạng thái đám mây đa thiết bị thời gian thực
-- Giúp đồng bộ tức thì giữa điện thoại và máy tính (Du khách <-> HDV <-> Admin)

CREATE TABLE IF NOT EXISTS public.cloud_shared_sync (
    key TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON public.cloud_shared_sync TO anon, authenticated, service_role;

ALTER TABLE public.cloud_shared_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc ghi dong bo toan bo" ON public.cloud_shared_sync;
CREATE POLICY "Cho phep doc ghi dong bo toan bo" ON public.cloud_shared_sync
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cloud_shared_sync;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
