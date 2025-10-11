SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict ROiAvfRuAQQtriyqUGljToEptKSzv0Rj7NKP2dNUTtwXShnbXl7eXAXDdlbsPwr

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'b55eccdf-c372-458b-9df5-fcc1ea263ddf', '{"action":"user_confirmation_requested","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-10-10 15:34:19.347185+00', ''),
	('00000000-0000-0000-0000-000000000000', '4fb12130-eb63-43e2-8f8e-351fa86d4ad5', '{"action":"user_signedup","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-10-10 15:35:24.411026+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd3b1565b-3114-4420-9d97-b1121850f31f', '{"action":"login","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 15:50:18.565943+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f07f76bb-ba04-46ac-b3c8-6ea51fd43b63', '{"action":"token_refreshed","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-10 16:48:19.95843+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c404ae10-595d-4256-b5f0-40a9292d6181', '{"action":"token_revoked","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-10 16:48:19.972187+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9427d9c-4f70-4a1c-ab8b-3d2f22ecbf14', '{"action":"user_confirmation_requested","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-10-10 17:03:20.638599+00', ''),
	('00000000-0000-0000-0000-000000000000', '919c0af1-194f-4731-a1e4-89fc2f87bb07', '{"action":"user_signedup","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-10-10 17:03:48.340221+00', ''),
	('00000000-0000-0000-0000-000000000000', '90cb08fa-d76a-4e2d-9714-fc127690c43d', '{"action":"login","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 17:03:55.782983+00', ''),
	('00000000-0000-0000-0000-000000000000', '6016e4b0-089d-40d0-bb2b-5fa8bc1eb158', '{"action":"logout","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-10 17:04:13.118306+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a7da0829-23f6-469f-a72f-f8a7e550fdf3', '{"action":"login","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 17:05:00.803044+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cacaf104-4de0-4ba5-8a67-544fa05490ee', '{"action":"login","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 17:10:24.224108+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4e7c3bd-4205-40e3-bb72-b6953ba90d06', '{"action":"login","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 17:33:30.114441+00', ''),
	('00000000-0000-0000-0000-000000000000', '2632d65f-e6e8-4e0f-aa12-4be0f1114d20', '{"action":"login","actor_id":"f00bae0f-41ff-467e-9463-90461fd553b6","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 17:56:14.786399+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da88f418-6315-4fb9-b4a2-65ff288c4346', '{"action":"logout","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-10 17:59:13.899256+00', ''),
	('00000000-0000-0000-0000-000000000000', '5992f845-ffe2-4c84-9167-bda0eb34ceb8', '{"action":"login","actor_id":"f5a35e14-646d-4348-b401-f55975fc69ea","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 17:59:19.652081+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f462eb5b-59b7-4de8-8868-4ebf6ceb5885', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"herwiglukas1@gmail.com","user_id":"f5a35e14-646d-4348-b401-f55975fc69ea","user_phone":""}}', '2025-10-10 18:12:58.995772+00', ''),
	('00000000-0000-0000-0000-000000000000', '335562b5-0b63-4692-b749-e867e86fc75e', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"herwiglukas1+1@gmail.com","user_id":"f00bae0f-41ff-467e-9463-90461fd553b6","user_phone":""}}', '2025-10-10 18:12:58.995946+00', ''),
	('00000000-0000-0000-0000-000000000000', '2d6ca355-6efd-4be2-bb29-3a05a848ad81', '{"action":"user_confirmation_requested","actor_id":"bc3400c6-85ce-40aa-a4c2-a10007822363","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-10-10 18:26:23.844891+00', ''),
	('00000000-0000-0000-0000-000000000000', '77086959-8a6b-4b9e-8b81-842bbc68a920', '{"action":"user_signedup","actor_id":"bc3400c6-85ce-40aa-a4c2-a10007822363","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-10-10 18:26:44.654055+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c3817109-a01a-48f0-8035-18ff805566c2', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"herwiglukas1@gmail.com","user_id":"bc3400c6-85ce-40aa-a4c2-a10007822363","user_phone":""}}', '2025-10-10 18:52:49.499137+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e8c1fe3c-05d6-4e27-b235-dc93b35961da', '{"action":"user_confirmation_requested","actor_id":"699d0ea2-a530-4016-8f47-8ff9b597a900","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-10-10 18:53:10.80974+00', ''),
	('00000000-0000-0000-0000-000000000000', '3a5e65b2-6822-4aef-a91e-66254b725a4e', '{"action":"user_signedup","actor_id":"699d0ea2-a530-4016-8f47-8ff9b597a900","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-10-10 18:53:19.535774+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d7caa2b-a489-47b5-b047-42f2ebe8bb24', '{"action":"user_confirmation_requested","actor_id":"5449bc94-7df0-44a8-9026-3a80e71e49b2","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-10-10 19:17:27.78128+00', ''),
	('00000000-0000-0000-0000-000000000000', '970566de-5e7c-4528-91bd-b554bd5bb488', '{"action":"user_signedup","actor_id":"5449bc94-7df0-44a8-9026-3a80e71e49b2","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-10-10 19:17:37.325084+00', ''),
	('00000000-0000-0000-0000-000000000000', '3e9a8bfe-846b-47c8-92b0-87c41b89d1f4', '{"action":"login","actor_id":"5449bc94-7df0-44a8-9026-3a80e71e49b2","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 19:17:49.02342+00', ''),
	('00000000-0000-0000-0000-000000000000', '53c10f7a-04ed-4f40-9d0a-5191d701f96c', '{"action":"login","actor_id":"5449bc94-7df0-44a8-9026-3a80e71e49b2","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 19:24:17.151181+00', ''),
	('00000000-0000-0000-0000-000000000000', '9403b18f-17be-4cd7-9b5b-18753b098aff', '{"action":"logout","actor_id":"5449bc94-7df0-44a8-9026-3a80e71e49b2","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-10 19:24:20.973575+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bd447c5f-285a-44d7-87db-3a1fb4ba67d6', '{"action":"login","actor_id":"699d0ea2-a530-4016-8f47-8ff9b597a900","actor_username":"herwiglukas1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 19:24:24.629825+00', ''),
	('00000000-0000-0000-0000-000000000000', '797199b0-8eec-43e1-9b39-5153e194ba30', '{"action":"login","actor_id":"5449bc94-7df0-44a8-9026-3a80e71e49b2","actor_username":"herwiglukas1+1@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 19:27:32.114542+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '699d0ea2-a530-4016-8f47-8ff9b597a900', 'authenticated', 'authenticated', 'herwiglukas1@gmail.com', '$2a$10$fFOPSJhSr7HJAvJTD0rjMuarq9g8/Pu6BtDz8XzJUMuHEbyoIKHsq', '2025-10-10 18:53:19.536459+00', NULL, '', '2025-10-10 18:53:10.811795+00', '', NULL, '', '', NULL, '2025-10-10 19:24:24.63058+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "699d0ea2-a530-4016-8f47-8ff9b597a900", "email": "herwiglukas1@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-10-10 18:53:10.797994+00', '2025-10-10 19:24:24.632828+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5449bc94-7df0-44a8-9026-3a80e71e49b2', 'authenticated', 'authenticated', 'herwiglukas1+1@gmail.com', '$2a$10$ONZn8bnXfBn3Mllw7EM3G.7Do0AjjTT5dzM0SYQtOfzFTulposMS2', '2025-10-10 19:17:37.326654+00', NULL, '', '2025-10-10 19:17:27.79079+00', '', NULL, '', '', NULL, '2025-10-10 19:27:32.118493+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "5449bc94-7df0-44a8-9026-3a80e71e49b2", "email": "herwiglukas1+1@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-10-10 19:17:27.725237+00', '2025-10-10 19:27:32.126056+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('699d0ea2-a530-4016-8f47-8ff9b597a900', '699d0ea2-a530-4016-8f47-8ff9b597a900', '{"sub": "699d0ea2-a530-4016-8f47-8ff9b597a900", "email": "herwiglukas1@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-10-10 18:53:10.806119+00', '2025-10-10 18:53:10.806171+00', '2025-10-10 18:53:10.806171+00', 'd25f6050-7589-46eb-86ee-7241c5069710'),
	('5449bc94-7df0-44a8-9026-3a80e71e49b2', '5449bc94-7df0-44a8-9026-3a80e71e49b2', '{"sub": "5449bc94-7df0-44a8-9026-3a80e71e49b2", "email": "herwiglukas1+1@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-10-10 19:17:27.767471+00', '2025-10-10 19:17:27.767529+00', '2025-10-10 19:17:27.767529+00', '68204d78-19cb-4817-b31e-f8dceebdfd73');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('6908a704-4937-40fc-bd33-43fc0acb766a', '699d0ea2-a530-4016-8f47-8ff9b597a900', '2025-10-10 18:53:19.540326+00', '2025-10-10 18:53:19.540326+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Safari/605.1.15', '155.4.45.6', NULL),
	('158efc0a-5987-4f4a-9038-ad290ed4b920', '699d0ea2-a530-4016-8f47-8ff9b597a900', '2025-10-10 19:24:24.630656+00', '2025-10-10 19:24:24.630656+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Safari/605.1.15', '155.4.45.6', NULL),
	('293bcc58-aca8-4bc7-a032-381cd13af905', '5449bc94-7df0-44a8-9026-3a80e71e49b2', '2025-10-10 19:27:32.120296+00', '2025-10-10 19:27:32.120296+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Safari/605.1.15', '155.4.45.6', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('6908a704-4937-40fc-bd33-43fc0acb766a', '2025-10-10 18:53:19.547172+00', '2025-10-10 18:53:19.547172+00', 'otp', 'a2ae085a-caa3-40b5-bfc6-33499de832c3'),
	('158efc0a-5987-4f4a-9038-ad290ed4b920', '2025-10-10 19:24:24.633125+00', '2025-10-10 19:24:24.633125+00', 'password', '94bbac65-ce8e-41b5-a0f8-f5bc2074f224'),
	('293bcc58-aca8-4bc7-a032-381cd13af905', '2025-10-10 19:27:32.126799+00', '2025-10-10 19:27:32.126799+00', 'password', 'd21ea3e5-38bc-4225-898f-b9a55520a9c5');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 14, '7enhffi3zx23', '699d0ea2-a530-4016-8f47-8ff9b597a900', false, '2025-10-10 18:53:19.542685+00', '2025-10-10 18:53:19.542685+00', NULL, '6908a704-4937-40fc-bd33-43fc0acb766a'),
	('00000000-0000-0000-0000-000000000000', 18, 'qiadpd6y5tks', '699d0ea2-a530-4016-8f47-8ff9b597a900', false, '2025-10-10 19:24:24.631951+00', '2025-10-10 19:24:24.631951+00', NULL, '158efc0a-5987-4f4a-9038-ad290ed4b920'),
	('00000000-0000-0000-0000-000000000000', 19, 'ei72xmqkgyf7', '5449bc94-7df0-44a8-9026-3a80e71e49b2', false, '2025-10-10 19:27:32.121981+00', '2025-10-10 19:27:32.121981+00', NULL, '293bcc58-aca8-4bc7-a032-381cd13af905');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "full_name", "created_at") VALUES
	('699d0ea2-a530-4016-8f47-8ff9b597a900', 'herwiglukas1@gmail.com', NULL, '2025-10-10 18:53:10.796994+00'),
	('5449bc94-7df0-44a8-9026-3a80e71e49b2', 'herwiglukas1+1@gmail.com', NULL, '2025-10-10 19:17:27.720621+00');


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wishlists" ("id", "title", "description", "creator_id", "created_at") VALUES
	('d9bce338-2018-4099-b36a-34ac8d282e6f', 'test list', NULL, '699d0ea2-a530-4016-8f47-8ff9b597a900', '2025-10-10 18:53:35.564251+00');


--
-- Data for Name: admin_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admin_invitations" ("id", "wishlist_id", "email", "invitation_token", "invited_by", "accepted", "created_at", "expires_at") VALUES
	('73788e8d-c86f-406b-99ad-8be726d63f4d', 'd9bce338-2018-4099-b36a-34ac8d282e6f', 'herwiglukas1+1@gmail.com', '433bd608-43bf-4e08-91b9-aa5bcf52a728', '699d0ea2-a530-4016-8f47-8ff9b597a900', true, '2025-10-10 19:00:52.011112+00', '2025-10-17 19:00:51.885+00');


--
-- Data for Name: share_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."share_links" ("id", "wishlist_id", "token", "created_by", "expires_at", "created_at") VALUES
	('1a0144c1-f836-4f38-a1b5-f00ac9010d6d', 'd9bce338-2018-4099-b36a-34ac8d282e6f', '749d7813-5745-4dd4-82c4-fc8be8214f68', '5449bc94-7df0-44a8-9026-3a80e71e49b2', NULL, '2025-10-10 19:41:38.839731+00');


--
-- Data for Name: wishlist_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wishlist_admins" ("id", "wishlist_id", "admin_id", "invited_by", "created_at") VALUES
	('0e160751-e28e-4d44-8858-bd3fb71a0461', 'd9bce338-2018-4099-b36a-34ac8d282e6f', '5449bc94-7df0-44a8-9026-3a80e71e49b2', '699d0ea2-a530-4016-8f47-8ff9b597a900', '2025-10-10 19:27:06.785549+00');


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wishlist_items" ("id", "wishlist_id", "title", "description", "price_range", "priority", "claimed_by", "claimed_at", "created_at", "updated_at", "url", "link", "is_taken", "taken_by_name", "taken_at") VALUES
	('310f5ad1-2108-4c8f-81c1-bf6e0eac3f27', 'd9bce338-2018-4099-b36a-34ac8d282e6f', 'test 1', NULL, NULL, 2, NULL, NULL, '2025-10-10 19:00:42.717745+00', '2025-10-10 19:00:42.717745+00', NULL, NULL, true, 'Lukas', '2025-10-10 19:52:09.332+00'),
	('a551aafd-b3bf-4e76-a91f-2f44c265f540', 'd9bce338-2018-4099-b36a-34ac8d282e6f', 'test 2', 'hej', '5000', 3, NULL, NULL, '2025-10-10 19:53:52.008496+00', '2025-10-10 19:53:52.008496+00', NULL, 'google.com', true, 'Prutt', '2025-10-10 19:54:48.961+00'),
	('a41375c4-a5f6-4f8c-a2a6-014ed1002205', 'd9bce338-2018-4099-b36a-34ac8d282e6f', 'test3', NULL, NULL, 2, NULL, NULL, '2025-10-10 19:57:49.416321+00', '2025-10-10 19:57:49.416321+00', NULL, NULL, true, 'Prutten mamma', '2025-10-10 19:58:54.824+00'),
	('86a5a6ec-11ef-441b-a7fc-24ea492b4700', 'd9bce338-2018-4099-b36a-34ac8d282e6f', 'test', NULL, NULL, 2, NULL, NULL, '2025-10-10 19:00:35.997988+00', '2025-10-10 19:00:35.997988+00', NULL, NULL, true, 'lille prutt', '2025-10-10 19:59:21.389+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 19, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict ROiAvfRuAQQtriyqUGljToEptKSzv0Rj7NKP2dNUTtwXShnbXl7eXAXDdlbsPwr

RESET ALL;
