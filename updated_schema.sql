


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_admin_on_invitation_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only proceed if the invitation was just accepted (changed from false to true)
  IF OLD.accepted = false AND NEW.accepted = true THEN
    -- Get the user ID for the accepted invitation email
    DECLARE
      invitee_user_id UUID;
    BEGIN
      SELECT id INTO invitee_user_id 
      FROM public.profiles 
      WHERE email = NEW.email 
      LIMIT 1;
      
      -- If we found the user, create the admin record
      IF invitee_user_id IS NOT NULL THEN
        INSERT INTO public.wishlist_admins (
          wishlist_id,
          admin_id,
          invited_by
        ) VALUES (
          NEW.wishlist_id,
          invitee_user_id,
          NEW.invited_by
        )
        -- Use ON CONFLICT to prevent duplicate records
        ON CONFLICT (wishlist_id) DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_admin_on_invitation_acceptance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_admin_on_invitation_acceptance"() IS 'Automatically creates wishlist_admins record when admin_invitations.accepted changes from false to true';



CREATE OR REPLACE FUNCTION "public"."handle_item_taken"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If item is being marked as taken and wasn't taken before
    IF NEW.is_taken = TRUE AND (OLD.is_taken = FALSE OR OLD.is_taken IS NULL) THEN
        NEW.taken_at = NOW();
    -- If item is being unmarked as taken
    ELSIF NEW.is_taken = FALSE THEN
        NEW.taken_at = NULL;
        NEW.taken_by_name = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_item_taken"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "invitation_token" "text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "accepted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."admin_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."share_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."share_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist_admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wishlist_admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price_range" "text",
    "priority" integer DEFAULT 2,
    "claimed_by" "uuid",
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "url" "text",
    "link" "text",
    "is_taken" boolean DEFAULT false NOT NULL,
    "taken_by_name" "text",
    "taken_at" timestamp with time zone
);


ALTER TABLE "public"."wishlist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "creator_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "enable_links" boolean DEFAULT true,
    "enable_price" boolean DEFAULT false,
    "enable_priority" boolean DEFAULT false
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_invitations"
    ADD CONSTRAINT "admin_invitations_invitation_token_key" UNIQUE ("invitation_token");



ALTER TABLE ONLY "public"."admin_invitations"
    ADD CONSTRAINT "admin_invitations_one_per_wishlist" UNIQUE ("wishlist_id");



COMMENT ON CONSTRAINT "admin_invitations_one_per_wishlist" ON "public"."admin_invitations" IS 'Enforces business rule: only one pending invitation allowed per wishlist';



ALTER TABLE ONLY "public"."admin_invitations"
    ADD CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."wishlist_admins"
    ADD CONSTRAINT "wishlist_admins_one_per_wishlist" UNIQUE ("wishlist_id");



COMMENT ON CONSTRAINT "wishlist_admins_one_per_wishlist" ON "public"."wishlist_admins" IS 'Enforces business rule: only one admin allowed per wishlist';



ALTER TABLE ONLY "public"."wishlist_admins"
    ADD CONSTRAINT "wishlist_admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "auto_create_admin_on_accept" AFTER UPDATE ON "public"."admin_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."create_admin_on_invitation_acceptance"();



COMMENT ON TRIGGER "auto_create_admin_on_accept" ON "public"."admin_invitations" IS 'Ensures admin record is created when invitation is accepted - maintains data consistency';



ALTER TABLE ONLY "public"."admin_invitations"
    ADD CONSTRAINT "admin_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_invitations"
    ADD CONSTRAINT "admin_invitations_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_admins"
    ADD CONSTRAINT "wishlist_admins_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_admins"
    ADD CONSTRAINT "wishlist_admins_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_admins"
    ADD CONSTRAINT "wishlist_admins_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_claimed_by_fkey" FOREIGN KEY ("claimed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."admin_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_invitations_policy" ON "public"."admin_invitations" USING (true);



CREATE POLICY "admins_can_read_wishlists" ON "public"."wishlists" FOR SELECT USING (("id" IN ( SELECT "wishlist_admins"."wishlist_id"
   FROM "public"."wishlist_admins"
  WHERE ("wishlist_admins"."admin_id" = "auth"."uid"()))));



CREATE POLICY "allow_anon_profile_read" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'anon'::"text"));



COMMENT ON POLICY "allow_anon_profile_read" ON "public"."profiles" IS 'Allows anonymous users to read profile info - needed for public wishlist pages to show creator names';



CREATE POLICY "allow_invitation_read_by_token" ON "public"."admin_invitations" FOR SELECT USING (true);



COMMENT ON POLICY "allow_invitation_read_by_token" ON "public"."admin_invitations" IS 'Allows anyone to read invitation data by token - needed for invitation acceptance page';



CREATE POLICY "allow_profile_read_for_invitations" ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "admin_invitations"."invited_by"
   FROM "public"."admin_invitations"
  WHERE (("admin_invitations"."accepted" = false) AND (("admin_invitations"."expires_at" IS NULL) OR ("admin_invitations"."expires_at" > "now"()))))));



COMMENT ON POLICY "allow_profile_read_for_invitations" ON "public"."profiles" IS 'Allows reading profile info for users who have sent pending invitations - needed for invitation acceptance page';



CREATE POLICY "allow_wishlist_read_for_invitations" ON "public"."wishlists" FOR SELECT USING (("id" IN ( SELECT "admin_invitations"."wishlist_id"
   FROM "public"."admin_invitations"
  WHERE (("admin_invitations"."accepted" = false) AND (("admin_invitations"."expires_at" IS NULL) OR ("admin_invitations"."expires_at" > "now"()))))));



COMMENT ON POLICY "allow_wishlist_read_for_invitations" ON "public"."wishlists" IS 'Allows reading wishlist info when there are pending invitations - needed for invitation acceptance page';



CREATE POLICY "anyone_can_read_share_links" ON "public"."share_links" FOR SELECT USING (true);



CREATE POLICY "creators_can_manage_share_links" ON "public"."share_links" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "creators_can_manage_wishlists" ON "public"."wishlists" USING (("auth"."uid"() = "creator_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_authenticated_read" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "profiles_own_modify" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "public_can_read_via_share_links" ON "public"."wishlists" FOR SELECT USING (("id" IN ( SELECT "share_links"."wishlist_id"
   FROM "public"."share_links"
  WHERE ("share_links"."token" IS NOT NULL))));



ALTER TABLE "public"."share_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "share_links_create" ON "public"."share_links" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "share_links_delete" ON "public"."share_links" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "share_links"."wishlist_id") AND ("wishlists"."creator_id" = "auth"."uid"()))))));



CREATE POLICY "share_links_own_access" ON "public"."share_links" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "share_links_update" ON "public"."share_links" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "users_can_access_own_profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."wishlist_admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlist_admins_insert_allowed" ON "public"."wishlist_admins" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_admins"."wishlist_id") AND ("wishlists"."creator_id" = "auth"."uid"())))) OR (("admin_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."admin_invitations"
  WHERE (("admin_invitations"."wishlist_id" = "wishlist_admins"."wishlist_id") AND ("admin_invitations"."email" = ( SELECT "profiles"."email"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))) AND ("admin_invitations"."accepted" = true) AND ("admin_invitations"."expires_at" > "now"())))))));



CREATE POLICY "wishlist_admins_simple_access" ON "public"."wishlist_admins" USING ((("auth"."uid"() = "admin_id") OR ("auth"."uid"() = "invited_by")));



COMMENT ON POLICY "wishlist_admins_simple_access" ON "public"."wishlist_admins" IS 'Allows admins to see their own records and inviters to see admin records they created - avoids recursion';



ALTER TABLE "public"."wishlist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlist_items_policy" ON "public"."wishlist_items" USING (true);



ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlists_admin_read" ON "public"."wishlists" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."wishlist_admins"
  WHERE (("wishlist_admins"."wishlist_id" = "wishlist_admins"."id") AND ("wishlist_admins"."admin_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."admin_invitations"
  WHERE (("admin_invitations"."wishlist_id" = "admin_invitations"."id") AND ("admin_invitations"."email" = ( SELECT "profiles"."email"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))))));



CREATE POLICY "wishlists_creator_access" ON "public"."wishlists" USING (("auth"."uid"() = "creator_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_admin_on_invitation_acceptance"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_on_invitation_acceptance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_on_invitation_acceptance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_item_taken"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_item_taken"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_item_taken"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_invitations" TO "anon";
GRANT ALL ON TABLE "public"."admin_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."share_links" TO "anon";
GRANT ALL ON TABLE "public"."share_links" TO "authenticated";
GRANT ALL ON TABLE "public"."share_links" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist_admins" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_admins" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_admins" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_items" TO "service_role";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
