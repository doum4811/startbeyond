-- -- 1. 의존하는 트리거를 먼저 확실히 삭제합니다.
-- DROP TRIGGER IF EXISTS user_to_profile_trigger ON auth.users;

-- 2. 함수를 생성하거나 교체합니다. (CREATE OR REPLACE 사용)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- SET SEARCH_PATH = public; -- SECURITY DEFINER 함수 내에서는 search_path가 이미 PostgreSQL 기본값 및 함수 소유자 설정을 따르므로,
                          -- 명시적으로 public으로 하는 것이 좋을 수도 있지만, 때로는 빼는 것이 더 안정적일 수 있습니다.
                          -- 일단 주석 처리하고, 만약 public.profiles 참조에 문제가 생기면 주석을 해제하고 다시 시도합니다.
AS $$
BEGIN
  INSERT INTO public.profiles ( -- 스키마를 명시하여 안정성 확보
    profile_id,
    full_name,
    username,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- 3. 트리거를 다시 생성합니다.
CREATE TRIGGER user_to_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 확인 메시지 (선택적)
SELECT 'User profile trigger setup complete (using CREATE OR REPLACE).';



-- create function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = ''
-- as $$
-- begin
--     if new.raw_app_meta_data is not null then
--         if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'email' then
--             insert into public.profiles (profile_id, name, username)
--             values (new.id, 'Anonymous', 'mr.' || substr(md5(random()::text), 1, 8));
--         end if;
--     end if;
--     return new;
-- end;
-- $$;

-- create trigger user_to_profile_trigger
-- after insert on auth.users
-- for each row execute function public.handle_new_user();

--------

-- create function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = ''
-- as $$
-- begin
--     if new.raw_app_meta_data is not null then
--         if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'email' then
--             if new.raw_user_meta_data ? 'name' and new.raw_user_meta_data ? 'username' then
--                 insert into public.profiles (profile_id, name, username, role)
--                 values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username', 'developer');
--             else
--                 insert into public.profiles (profile_id, name, username, role)
--                 values (new.id, 'Anonymous', 'mr.' || substr(md5(random()::text), 1, 8), 'developer');
--             end if;
--         end if;
--     end if;
--     return new;
-- end;
-- $$;

-- create trigger user_to_profile_trigger
-- after insert on auth.users
-- for each row execute function public.handle_new_user();